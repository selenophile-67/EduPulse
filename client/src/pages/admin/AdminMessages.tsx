import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Mail, MailOpen } from 'lucide-react';
import { api, errorMessage, queryString } from '../../lib/api';
import type { Paginated } from '../../lib/types';
import { Badge, Button, EmptyState, ErrorState, Modal, PageLoader, Pagination, Select } from '../../components/ui';
import { formatDateTime } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

interface AdminMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'new' | 'read' | 'resolved';
  created_at: string;
}

const STATUS_TONE = { new: 'brand', read: 'info', resolved: 'success' } as const;

export function AdminMessagesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<AdminMessageRow | null>(null);
  const [updating, setUpdating] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-messages', { page, status }],
    queryFn: () => api.get<Paginated<AdminMessageRow>>(`/admin/messages${queryString({ page, limit: 20, status })}`),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const setMessageStatus = async (message: AdminMessageRow, next: AdminMessageRow['status']) => {
    setUpdating(true);
    try {
      await api.patch(`/admin/messages/${message.id}`, { status: next });
      toast.success(next === 'resolved' ? 'Marked as resolved' : 'Marked as read');
      setSelected((current) => (current && current.id === message.id ? { ...current, status: next } : current));
      invalidate();
    } catch (cause) {
      toast.error('Could not update message', errorMessage(cause));
    } finally {
      setUpdating(false);
    }
  };

  const open = (message: AdminMessageRow) => {
    setSelected(message);
    if (message.status === 'new') void setMessageStatus(message, 'read');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Contact messages</h1>
        <p className="mt-1 text-sm text-ink-muted">Messages submitted through the public contact form. Mark them read as you triage, then resolved once answered.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-9 w-44 text-xs" aria-label="Filter by message status">
          <option value="">All messages</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="resolved">Resolved</option>
        </Select>
        <span className="text-xs text-ink-muted">{data?.total ?? 0} messages</span>
      </div>

      {isLoading ? (
        <PageLoader label="Loading messages" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <div className="card">
          <EmptyState icon={<Mail size={22} />} title="Inbox zero" description="No contact messages match this filter. New submissions from the contact page will appear here." />
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((message) => (
            <button
              key={message.id}
              onClick={() => open(message)}
              className="card flex w-full flex-wrap items-center gap-4 p-4 text-left transition hover:border-brand/40 hover:shadow-lift"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink-muted">
                {message.status === 'new' ? <Mail size={17} /> : <MailOpen size={17} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm ${message.status === 'new' ? 'font-semibold text-ink' : 'font-medium text-ink-soft'}`}>
                    {message.subject || '(no subject)'}
                  </span>
                  <Badge tone={STATUS_TONE[message.status]}>{message.status}</Badge>
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-muted">{message.name} · {message.email}</span>
              </span>
              <span className="text-[11px] text-ink-muted">{formatDateTime(message.created_at)}</span>
            </button>
          ))}
        </div>
      )}

      {data && <Pagination page={page} total={data.total} limit={data.limit} onPage={setPage} />}

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.subject || '(no subject)'}
        description={selected ? `${selected.name} · ${selected.email}` : undefined}
        footer={
          selected && (
            <>
              <Button variant="secondary" onClick={() => setMessageStatus(selected, 'read')} loading={updating && selected.status !== 'resolved'} disabled={selected.status === 'read'} icon={<MailOpen size={14} />}>
                Mark read
              </Button>
              <Button onClick={() => setMessageStatus(selected, 'resolved')} loading={updating && selected.status !== 'read'} disabled={selected.status === 'resolved'} icon={<CheckCheck size={14} />}>
                Mark resolved
              </Button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-ink-muted">
              <span>Received {formatDateTime(selected.created_at)}</span>
              <a href={`mailto:${selected.email}`} className="font-medium text-brand-strong hover:underline">{selected.email}</a>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{selected.message}</p>
            <p className="text-[11px] text-ink-muted">Status updates are stored immediately. Replies are sent from your own email client — this deployment does not configure outbound email.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
