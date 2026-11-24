import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, BookOpen, CalendarDays, ClipboardCheck, GraduationCap, Layers, Radio, Users,
} from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { TeacherOverviewData } from '../../lib/types';
import { Avatar, Badge, ErrorState, LinkButton, PageLoader, StatCard } from '../../components/ui';
import { formatCompact, formatCurrency, formatDate, formatDuration, formatTime, timeAgo } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';

function statusTone(status: string) {
  return status === 'published' ? 'success' : status === 'draft' ? 'warning' : 'neutral';
}

export function TeacherOverviewPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-overview'],
    queryFn: () => api.get<TeacherOverviewData>('/teacher/overview'),
  });

  if (isLoading) return <PageLoader label="Loading your workspace" />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const nameParts = (user?.name || 'Educator').split(' ');
  const greeting = nameParts[0].endsWith('.') && nameParts[1] ? `${nameParts[0]} ${nameParts[1]}` : nameParts[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Educator workspace</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">Welcome back, {greeting}</h1>
          <p className="mt-1 text-sm text-ink-muted">Live numbers from your courses, students and test activity.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to="/teacher/live-classes" variant="secondary" icon={<Radio size={14} />}>Schedule class</LinkButton>
          <LinkButton to="/teacher/courses?create=1" icon={<BookOpen size={14} />}>New course</LinkButton>
        </div>
      </div>

      {user && user.profile?.approved === false && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
          Your educator account is awaiting administrator approval. Publishing is disabled until approval is granted.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Students" value={formatCompact(data.stats.students)} icon={<Users size={18} />} hint={`${data.stats.publishedCourses} published course${data.stats.publishedCourses === 1 ? '' : 's'}`} />
        <StatCard label="Upcoming classes" value={data.stats.upcomingClasses} icon={<CalendarDays size={18} />} tone="info" hint={data.upcoming[0] ? `Next: ${formatDate(data.upcoming[0].scheduledStart)} at ${formatTime(data.upcoming[0].scheduledStart)}` : 'Nothing scheduled'} />
        <StatCard label="Lectures published" value={formatCompact(data.stats.lectures)} icon={<Layers size={18} />} tone="violet" hint="Across all your courses" />
        <StatCard label="Published tests" value={formatCompact(data.stats.publishedTests)} icon={<ClipboardCheck size={18} />} tone="success" hint="Visible in the test series" />
        <StatCard label="Average student accuracy" value={data.stats.avgAccuracy === null ? 'No data' : `${data.stats.avgAccuracy}%`} icon={<GraduationCap size={18} />} tone="amber" hint="Computed from submitted results" />
        <StatCard label="New enrolments (latest)" value={data.recentEnrollments.length} icon={<Users size={18} />} hint={data.recentEnrollments[0] ? `${data.recentEnrollments[0].name} · ${timeAgo(data.recentEnrollments[0].enrolled_at)}` : 'No enrolments yet'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ink">Your courses</h2>
            <Link to="/teacher/courses" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-strong">Manage all <ArrowRight size={12} /></Link>
          </div>
          {data.courses.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">No courses yet. Create your first course to start publishing lectures.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="pb-2 font-semibold">Course</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 text-right font-semibold">Students</th>
                    <th className="pb-2 text-right font-semibold">Lectures</th>
                    <th className="pb-2 text-right font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {data.courses.slice(0, 6).map((course) => (
                    <tr key={course.id} className="border-b border-line/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <Link to={`/teacher/courses/${course.id}`} className="font-medium text-ink hover:text-brand-strong">{course.title}</Link>
                        <p className="text-[11px] text-ink-muted">{course.exam} · updated {timeAgo(course.updatedAt)}</p>
                      </td>
                      <td className="py-2.5"><Badge tone={statusTone(course.status)}>{course.status}</Badge></td>
                      <td className="py-2.5 text-right tabular-nums">{course.enrolledCount}</td>
                      <td className="py-2.5 text-right tabular-nums">{course.lectureCount}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatCurrency(course.priceCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="card p-5">
            <h2 className="text-base font-semibold text-ink">Upcoming live classes</h2>
            {data.upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Nothing scheduled. <Link to="/teacher/live-classes" className="font-semibold text-brand-strong">Schedule a class</Link>.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {data.upcoming.map((session) => (
                  <div key={session.id} className="rounded-xl border border-line bg-surface-2 p-3">
                    <p className="text-sm font-medium text-ink">{session.title}</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">
                      {session.courseTitle || 'Open session'} · {formatDate(session.scheduledStart)} at {formatTime(session.scheduledStart)}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-muted">{session.attendeeCount} students joined so far</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-ink">Recent enrolments</h2>
            {data.recentEnrollments.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No enrolments yet.</p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {data.recentEnrollments.map((item, index) => (
                  <div key={`${item.course_id}-${item.enrolled_at}-${index}`} className="flex items-center gap-2.5">
                    <Avatar name={item.name} color={item.avatar_color} size={28} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-ink">{item.name}</p>
                      <p className="truncate text-[11px] text-ink-muted">{item.course_title}</p>
                    </div>
                    <span className="shrink-0 text-[10px] text-ink-muted">{timeAgo(item.enrolled_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-ink">Student activity</h2>
          <Link to="/teacher/students" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-strong">All students <ArrowRight size={12} /></Link>
        </div>
        {data.students.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">Students appear here once they enrol in your courses.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="pb-2 font-semibold">Student</th>
                  <th className="pb-2 text-right font-semibold">Courses</th>
                  <th className="pb-2 text-right font-semibold">Tests</th>
                  <th className="pb-2 text-right font-semibold">Avg accuracy</th>
                  <th className="pb-2 text-right font-semibold">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {data.students.slice(0, 8).map((student) => (
                  <tr key={student.id} className="border-b border-line/60 last:border-0">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={student.name} color={student.avatar_color} size={26} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{student.name}</p>
                          <p className="truncate text-[11px] text-ink-muted">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{student.course_count}</td>
                    <td className="py-2.5 text-right tabular-nums">{student.tests_taken}</td>
                    <td className="py-2.5 text-right tabular-nums">{student.avg_accuracy === null ? '—' : `${student.avg_accuracy}%`}</td>
                    <td className="py-2.5 text-right text-[11px] text-ink-muted">{student.last_active ? timeAgo(student.last_active) : 'No tests yet'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {data.courses.slice(0, 3).map((course) => (
          <div key={course.id} className="card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{course.exam}</p>
            <p className="mt-1 truncate text-sm font-semibold text-ink">{course.title}</p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-ink-muted">
              <span>{course.lectureCount} lectures · {formatDuration(course.totalDurationSeconds)}</span>
              <span>{course.ratingAvg ? `${course.ratingAvg}★` : 'No ratings'}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">{course.enrolledCount} enrolled</span>
              <LinkButton to={`/teacher/courses/${course.id}`} variant="secondary" size="sm" className="h-7 px-2">Open</LinkButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
