import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, GraduationCap, ShieldCheck } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { PendingTeacher } from '../../lib/types';
import { Avatar, Badge, Button, EmptyState, ErrorState, LinkButton, PageLoader } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

export function AdminTeachersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [approving, setApproving] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get<{ teachers: PendingTeacher[] }>('/admin/teachers/pending'),
  });

  const approve = async (teacher: PendingTeacher) => {
    if (!window.confirm(`Approve ${teacher.name}? They will immediately be able to publish courses and tests.`)) return;
    setApproving(teacher.id);
    try {
      await api.post(`/admin/teachers/${teacher.id}/approve`);
      toast.success('Educator approved', `${teacher.name} can now publish content.`);
      queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (cause) {
      toast.error('Could not approve educator', errorMessage(cause));
    } finally {
      setApproving(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Teacher approvals</h1>
          <p className="mt-1 text-sm text-ink-muted">Review educators before they can create courses, schedule live classes and publish tests.</p>
        </div>
        <LinkButton to="/admin/users" variant="secondary" size="sm" icon={<GraduationCap size={14} />}>All teacher accounts</LinkButton>
      </div>

      {isLoading ? (
        <PageLoader label="Loading pending educators" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.teachers.length ? (
        <div className="card">
          <EmptyState
            icon={<ShieldCheck size={22} />}
            title="No educators awaiting approval"
            description="New self-registered teacher accounts appear here. Accounts created by an administrator are approved automatically."
            action={<LinkButton to="/admin/users" variant="secondary" size="sm">Manage users</LinkButton>}
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.teachers.map((teacher) => (
            <article key={teacher.id} className="card space-y-4 p-5">
              <div className="flex items-start gap-3">
                <Avatar name={teacher.name} color={teacher.avatar_color} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{teacher.name}</p>
                  <p className="truncate text-xs text-ink-muted">{teacher.email}</p>
                  {teacher.phone && <p className="text-xs text-ink-muted">{teacher.phone}</p>}
                </div>
                <Badge tone="warning">Pending</Badge>
              </div>
              <dl className="space-y-2 text-xs">
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-ink-muted">Headline</dt>
                  <dd className="mt-0.5 text-ink-soft">{teacher.headline || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-ink-muted">Qualification</dt>
                  <dd className="mt-0.5 text-ink-soft">{teacher.qualification || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-ink-muted">Subjects</dt>
                  <dd className="mt-0.5 text-ink-soft">{teacher.subjects || 'Not provided'}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-ink-muted">Registered</dt>
                  <dd className="mt-0.5 text-ink-soft">{formatDate(teacher.created_at)}</dd>
                </div>
              </dl>
              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button size="sm" onClick={() => approve(teacher)} loading={approving === teacher.id} icon={<BadgeCheck size={14} />}>
                  Approve educator
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-ink-muted">Approval grants content-publishing permissions immediately. Suspending an approved educator from the Users screen revokes their active sessions.</p>
    </div>
  );
}
