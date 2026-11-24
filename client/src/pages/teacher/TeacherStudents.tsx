import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Performance, TeacherStudentRow } from '../../lib/types';
import { Avatar, Badge, ErrorState, Input, Modal, PageLoader, Progress, StatCard } from '../../components/ui';
import { BarChart } from '../../components/charts';
import { formatDate, timeAgo } from '../../lib/format';

export function TeacherStudentsPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TeacherStudentRow | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => api.get<{ students: TeacherStudentRow[] }>('/teacher/students'),
  });

  const detail = useQuery({
    queryKey: ['teacher-student', selected?.id],
    queryFn: () => api.get<{ performance: Performance; courses: { id: string; title: string; thumbnail_theme: string | null; lecture_count: number; completed_count: number }[] }>(`/teacher/students/${selected?.id}`),
    enabled: Boolean(selected),
  });

  const students = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.students ?? []).filter((student) => !term || student.name.toLowerCase().includes(term) || student.email.toLowerCase().includes(term));
  }, [data, search]);

  if (isLoading) return <PageLoader label="Loading students" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Students</h1>
        <p className="mt-1 text-sm text-ink-muted">Every enrolled student across your courses, with real accuracy and activity data.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email…" className="h-9 pl-8 text-sm" />
        </div>
        <span className="text-xs text-ink-muted">{students.length} of {data?.students.length ?? 0}</span>
      </div>

      {students.length === 0 ? (
        <div className="card p-10 text-center">
          <Users size={24} className="mx-auto text-ink-muted" />
          <p className="mt-3 text-sm font-semibold text-ink">No students yet</p>
          <p className="mt-1 text-xs text-ink-muted">Students appear once they enrol in one of your courses.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2.5 font-semibold">Student</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Courses</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Tests taken</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Avg accuracy</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Last activity</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={student.name} color={student.avatar_color} size={28} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{student.name}</p>
                          <p className="truncate text-[11px] text-ink-muted">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{student.course_count}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{student.tests_taken}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{student.avg_accuracy === null ? '—' : `${student.avg_accuracy}%`}</td>
                    <td className="px-4 py-3 text-right text-[11px] text-ink-muted">{student.last_active ? timeAgo(student.last_active) : 'No tests yet'}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelected(student)} className="rounded-lg border border-line px-2.5 py-1 text-[11px] font-semibold text-ink-soft hover:border-brand hover:text-brand-strong">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name || 'Student'} description={selected?.email} size="lg">
        {detail.isLoading ? (
          <PageLoader label="Loading student activity" />
        ) : detail.error ? (
          <ErrorState message={errorMessage(detail.error)} onRetry={() => detail.refetch()} />
        ) : detail.data ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatCard label="Study time" value={`${Math.round(detail.data.performance.studyTimeSeconds / 3600)}h`} />
              <StatCard label="Lectures watched" value={detail.data.performance.lecturesWatched} tone="violet" />
              <StatCard label="Tests submitted" value={detail.data.performance.results.length} tone="success" />
              <StatCard label="Weakest subject" value={detail.data.performance.weakSubjects[0]?.subject || '—'} tone="amber" />
            </div>

            <div className="rounded-xl border border-line p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Subject accuracy</p>
              {detail.data.performance.subjects.length === 0 ? (
                <p className="text-xs text-ink-muted">No submitted tests yet.</p>
              ) : (
                <BarChart data={detail.data.performance.subjects.map((subject) => ({ label: subject.subject, value: subject.accuracy }))} />
              )}
            </div>

            <div className="rounded-xl border border-line p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Your courses</p>
              <div className="space-y-2">
                {detail.data.courses.map((course) => {
                  const percent = course.lecture_count ? Math.round((course.completed_count / course.lecture_count) * 100) : 0;
                  return (
                    <div key={course.id}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="truncate text-ink-soft">{course.title}</span>
                        <span className="shrink-0 text-ink-muted">{course.completed_count}/{course.lecture_count} lectures</span>
                      </div>
                      <Progress value={percent} size="sm" className="mt-1" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-line p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Recent results</p>
              {detail.data.performance.results.length === 0 ? (
                <p className="text-xs text-ink-muted">No tests submitted yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {detail.data.performance.results.slice(-5).reverse().map((result) => (
                    <div key={result.id} className="flex flex-wrap items-center justify-between gap-1 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs">
                      <span className="min-w-0 truncate font-medium text-ink">{result.testTitle}</span>
                      <span className="flex items-center gap-1.5 text-ink-muted">
                        <Badge tone="neutral">{result.exam}</Badge>
                        {result.score}/{result.maxMarks} · {result.accuracy}%
                        <span className="text-[10px]">{formatDate(result.createdAt)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
