import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, ExternalLink, Trash2 } from 'lucide-react';
import { api, errorMessage, queryString } from '../../lib/api';
import type { Notification, Paginated } from '../../lib/types';
import { Button, EmptyState, ErrorState, PageLoader, Pagination, SectionHeading, Tabs } from '../../components/ui';
import { timeAgo } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/cn';

type Filter = 'all' | 'unread';
type NotificationList = Paginated<Notification> & { unreadCount: number };

export function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const { setUnreadCount } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications-page', filter, page],
    queryFn: async () => {
      const result = await api.get<NotificationList>(`/notifications${queryString({ filter, page, limit: 20 })}`);
      setUnreadCount(result.unreadCount);
      return result;
    },
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notification-badge'] });
  };

  const markAll = async () => {
    setBusyId('all');
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      refreshAll();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  const markRead = async (notification: Notification) => {
    if (notification.readAt) return;
    setBusyId(notification.id);
    try {
      const result = await api.patch<{ unreadCount: number }>(`/notifications/${notification.id}/read`);
      setUnreadCount(result.unreadCount);
      refreshAll();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (notification: Notification) => {
    setBusyId(notification.id);
    try {
      const result = await api.delete<{ unreadCount: number }>(`/notifications/${notification.id}`);
      setUnreadCount(result.unreadCount);
      toast.success('Notification removed');
      refreshAll();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  };

  const items = data?.items || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Inbox" title="Notifications" description="Live class reminders, test results and account updates." className="mb-0" />
        <Button variant="secondary" onClick={markAll} loading={busyId === 'all'} disabled={(data?.unreadCount || 0) === 0} icon={<CheckCheck size={15} />}>
          Mark all read
        </Button>
      </div>

      <Tabs
        value={filter}
        onChange={(value) => { setFilter(value); setPage(1); }}
        tabs={[
          { value: 'all', label: 'All', count: data?.total },
          { value: 'unread', label: 'Unread', count: data?.unreadCount },
        ]}
      />

      {isLoading ? (
        <PageLoader label="Loading notifications" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Bell size={22} />}
          title={filter === 'unread' ? 'You are all caught up' : 'No notifications yet'}
          description="Enrol in a course, schedule activity or submit a test and updates will appear here."
        />
      ) : (
        <>
          <div className="card divide-y divide-line overflow-hidden">
            {items.map((notification) => (
              <div key={notification.id} className={cn('flex items-start gap-3 px-4 py-3.5', !notification.readAt && 'bg-brand-soft/40 dark:bg-brand/5')}>
                <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', notification.readAt ? 'bg-surface-2 text-ink-muted' : 'bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300')}>
                  <Bell size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{notification.title}</p>
                    {!notification.readAt && <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-label="Unread" />}
                  </div>
                  {notification.body && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{notification.body}</p>}
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
                    <span>{timeAgo(notification.createdAt)}</span>
                    {notification.link && (
                      <Link to={notification.link} onClick={() => markRead(notification)} className="inline-flex items-center gap-1 font-semibold text-brand-strong">
                        Open <ExternalLink size={10} />
                      </Link>
                    )}
                    {!notification.readAt && (
                      <button
                        type="button"
                        onClick={() => markRead(notification)}
                        disabled={busyId === notification.id}
                        className="font-semibold text-ink-soft hover:text-ink disabled:opacity-50"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(notification)}
                  disabled={busyId === notification.id}
                  className="rounded-lg p-1.5 text-ink-muted transition hover:bg-surface-2 hover:text-danger disabled:opacity-50"
                  aria-label="Delete notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          {data && <Pagination page={page} total={data.total} limit={data.limit} onPage={setPage} />}
        </>
      )}
    </div>
  );
}
