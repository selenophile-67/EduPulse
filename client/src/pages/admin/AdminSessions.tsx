import { useQuery } from '@tanstack/react-query';
import { Laptop, MonitorSmartphone, ShieldAlert } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Role } from '../../lib/types';
import { Avatar, Badge, EmptyState, ErrorState, PageLoader } from '../../components/ui';
import { formatDateTime, timeAgo } from '../../lib/format';

interface AdminSessionRow {
  id: string;
  user_agent: string | null;
  ip: string | null;
  created_at: string;
  last_seen_at: string;
  name: string;
  email: string;
  role: Role;
  avatar_color: string;
}

function describeDevice(userAgent: string | null) {
  if (!userAgent) return 'Unknown device';
  const browser = userAgent.includes('Edg/') ? 'Edge' : userAgent.includes('Chrome/') ? 'Chrome' : userAgent.includes('Firefox/') ? 'Firefox' : userAgent.includes('Safari/') ? 'Safari' : 'Browser';
  const os = userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac OS') ? 'macOS' : userAgent.includes('Android') ? 'Android' : userAgent.includes('iPhone') || userAgent.includes('iPad') ? 'iOS' : userAgent.includes('Linux') ? 'Linux' : 'Unknown OS';
  return `${browser} on ${os}`;
}

export function AdminSessionsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => api.get<{ sessions: AdminSessionRow[] }>('/admin/sessions'),
    refetchInterval: 60_000,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Active sessions</h1>
        <p className="mt-1 text-sm text-ink-muted">Live authenticated sessions across all accounts, most recently active first. Suspending or resetting a user's password revokes every session immediately.</p>
      </div>

      {isLoading ? (
        <PageLoader label="Loading sessions" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.sessions.length ? (
        <div className="card">
          <EmptyState icon={<ShieldAlert size={22} />} title="No active sessions" description="Sessions appear here once people sign in. The list refreshes automatically every minute." />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2.5 font-semibold">User</th>
                  <th className="px-4 py-2.5 font-semibold">Role</th>
                  <th className="px-4 py-2.5 font-semibold">Device</th>
                  <th className="px-4 py-2.5 font-semibold">IP</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Signed in</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Last seen</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session) => (
                  <tr key={session.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={session.name} color={session.avatar_color} size={30} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{session.name}</p>
                          <p className="truncate text-[11px] text-ink-muted">{session.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={session.role === 'admin' ? 'brand' : session.role === 'teacher' ? 'info' : 'neutral'}>{session.role}</Badge></td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-2 text-xs text-ink-soft">
                        {session.user_agent?.includes('Mobile') ? <MonitorSmartphone size={14} className="text-ink-muted" /> : <Laptop size={14} className="text-ink-muted" />}
                        {describeDevice(session.user_agent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-ink-muted">{session.ip || '—'}</td>
                    <td className="px-4 py-3 text-right text-[11px] text-ink-muted">{formatDateTime(session.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-ink-soft">{timeAgo(session.last_seen_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-ink-muted">Showing the 100 most recently active sessions. Expired and revoked sessions are excluded at the API level.</p>
    </div>
  );
}
