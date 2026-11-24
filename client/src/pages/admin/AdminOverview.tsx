import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, BookOpen, CreditCard, FileText, GraduationCap, Layers, Mail, Users, Video,
} from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { AdminOverviewData } from '../../lib/types';
import { Avatar, Badge, ErrorState, LinkButton, PageLoader, StatCard } from '../../components/ui';
import { LineChart } from '../../components/charts';
import { formatCompact, timeAgo } from '../../lib/format';

const INTEGRATION_LABELS: Record<string, string> = {
  razorpay: 'Razorpay payments',
  livekit: 'LiveKit streaming',
  llm: 'AI tutor LLM',
  smtp: 'Email (SMTP)',
  s3: 'S3 storage',
};

export function AdminOverviewPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get<AdminOverviewData>('/admin/overview'),
  });

  if (isLoading) return <PageLoader label="Loading platform overview" />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Admin console</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">Platform overview</h1>
          <p className="mt-1 text-sm text-ink-muted">Live counts from the SQLite database and deployment environment.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to="/admin/teachers" variant="secondary" icon={<GraduationCap size={14} />}>Approvals</LinkButton>
          <LinkButton to="/admin/users" icon={<Users size={14} />}>Manage users</LinkButton>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Students" value={formatCompact(data.counts.students)} icon={<Users size={18} />} hint={`${data.counts.new_users_30d} joined in the last 30 days`} />
        <StatCard label="Educators" value={formatCompact(data.counts.teachers)} icon={<GraduationCap size={18} />} tone="violet" hint={`${data.counts.total_users} total users`} />
        <StatCard label="Published courses" value={data.counts.published_courses} icon={<BookOpen size={18} />} tone="success" hint={`${data.counts.total_courses} courses including drafts`} />
        <StatCard label="Active enrolments" value={formatCompact(data.counts.enrollments)} icon={<Layers size={18} />} tone="info" hint={`${data.counts.test_attempts} submitted test attempts`} />
        <StatCard label="Live sessions" value={data.counts.live_sessions} icon={<Video size={18} />} hint="All scheduled and completed" />
        <StatCard label="Materials" value={data.counts.materials} icon={<FileText size={18} />} tone="amber" hint="PDFs across courses" />
        <StatCard label="New messages" value={data.counts.new_messages} icon={<Mail size={18} />} tone="brand" hint="Contact form inbox" />
        <StatCard
          label="Revenue"
          value={data.counts.revenueCents === null ? 'Not tracked' : `₹${data.counts.revenueCents / 100}`}
          icon={<CreditCard size={18} />}
          tone="success"
          hint={data.counts.paymentsConfigured ? 'Gateway configured' : 'No payment gateway configured'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink">New registrations by month</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Last six months, from the users table.</p>
          <div className="mt-3">
            <LineChart data={data.monthlyRegistrations.map((row) => ({ label: row.month, value: row.count }))} suffix="" height={200} color="#6366f1" />
          </div>
        </section>
        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink">Enrolments by month</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Last six months, from the enrolments table.</p>
          <div className="mt-3">
            <LineChart data={data.monthlyEnrollments.map((row) => ({ label: row.month, value: row.count }))} suffix="" height={200} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Popular courses</h2>
            <Link to="/admin/courses" className="text-xs font-semibold text-brand-strong">All courses</Link>
          </div>
          {data.popularCourses.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">No published courses yet.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.popularCourses.map((course, index) => (
                <div key={course.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-bold text-ink-soft">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{course.title}</p>
                    <p className="truncate text-[11px] text-ink-muted">{course.teacher_name} · {course.exam}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">{course.enrolled_count}</p>
                    <p className="text-[10px] text-ink-muted">enrolled</p>
                  </div>
                  <span className="w-10 text-right text-[11px] text-ink-muted">{course.rating_avg ? `${course.rating_avg}★` : '—'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Newest users</h2>
            <Link to="/admin/users" className="text-xs font-semibold text-brand-strong">User directory</Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {data.recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2.5">
                <Avatar name={user.name} color={user.avatar_color} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-ink">{user.name}</p>
                  <p className="truncate text-[10px] text-ink-muted">{user.email}</p>
                </div>
                <Badge tone={user.role === 'admin' ? 'violet' : user.role === 'teacher' ? 'info' : 'neutral'}>{user.role}</Badge>
                <span className="shrink-0 text-[10px] text-ink-muted">{timeAgo(user.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-base font-semibold text-ink">Integration status</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Read from server environment variables. Secrets are never sent to the browser.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {Object.entries(INTEGRATION_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs">
                <span className="text-ink-soft">{label}</span>
                <Badge tone={data.integrations[key] ? 'success' : 'neutral'}>{data.integrations[key] ? 'Configured' : 'Not configured'}</Badge>
              </div>
            ))}
          </div>
          <LinkButton to="/admin/integrations" variant="secondary" size="sm" className="mt-3">Open diagnostics</LinkButton>
        </section>

        <section className="card p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Activity size={16} className="text-brand" /> System</h2>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ['Environment', data.system.environment],
              ['Node', data.system.nodeVersion],
              ['Platform', data.system.platform],
              ['Uptime', `${Math.floor(data.system.uptimeSeconds / 3600)}h ${Math.floor((data.system.uptimeSeconds % 3600) / 60)}m`],
              ['Memory (RSS)', `${data.system.memoryUsedMb} MB`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-line bg-surface-2 px-3 py-2">
                <dt className="text-[10px] uppercase tracking-wide text-ink-muted">{label}</dt>
                <dd className="mt-0.5 truncate text-xs font-medium text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
