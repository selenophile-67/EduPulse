import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CalendarDays, PlayCircle, Search } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { StudentDashboard } from '../../lib/types';
import { EmptyState, ErrorState, LinkButton, Progress, SearchInput, SectionHeading, Skeleton } from '../../components/ui';
import { courseTheme } from '../../lib/theme';
import { formatDate } from '../../lib/format';

export function MyLearningPage() {
  const [term, setTerm] = useState('');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['learning-overview'],
    queryFn: () => api.get<StudentDashboard>('/learning/overview'),
  });

  const enrollments = useMemo(() => {
    if (!data) return [];
    const needle = term.trim().toLowerCase();
    if (!needle) return data.enrollments;
    return data.enrollments.filter((enrollment) =>
      [enrollment.course.title, enrollment.course.exam, enrollment.course.category, enrollment.course.teacherName]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [data, term]);

  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-2xl" />)}
      </div>
    );
  }
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="My learning"
          title="Your enrolled courses"
          description="Curriculum, progress, live classes, tests and materials for every active enrolment."
          className="mb-0"
        />
        <div className="flex gap-2">
          <SearchInput value={term} onChange={setTerm} placeholder="Find a course…" className="w-56" />
          <LinkButton to="/courses" variant="secondary" icon={<Search size={14} />}>Browse</LinkButton>
        </div>
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={22} />}
          title={term ? 'No courses match your search' : 'No active enrolments yet'}
          description={term ? 'Try a different exam, subject or educator name.' : 'Free courses enrol instantly and unlock the full curriculum.'}
          action={<LinkButton to="/courses">Explore courses</LinkButton>}
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {enrollments.map((enrollment) => {
            const theme = courseTheme(enrollment.course.theme);
            return (
              <div key={enrollment.enrollmentId} className="card flex flex-col overflow-hidden">
                <div className="relative p-5 text-white" style={{ background: theme.gradient }}>
                  <div className="bg-dots absolute inset-0 opacity-20" />
                  <div className="relative">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                      <span>{enrollment.course.exam} · {enrollment.course.language}</span>
                      <span>{enrollment.progressPercent}%</span>
                    </div>
                    <h3 className="mt-1.5 line-clamp-2 font-display text-base font-bold leading-snug">{enrollment.course.title}</h3>
                    <p className="mt-1 text-[11px] text-white/60">{enrollment.course.teacherName} · {enrollment.course.level}</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <Progress value={enrollment.progressPercent} tone={enrollment.progressPercent >= 100 ? 'success' : 'brand'} />
                  <div className="mt-2 flex items-center justify-between text-[11px] text-ink-muted">
                    <span>{enrollment.completedCount} of {enrollment.lectureCount} lectures done</span>
                    <span>{enrollment.progressPercent >= 100 ? 'Completed' : 'In progress'}</span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[11px] text-ink-muted">
                    <p className="flex items-center gap-1.5"><CalendarDays size={12} /> Enrolled {formatDate(enrollment.enrolledAt)}</p>
                    <p className="flex items-center gap-1.5"><PlayCircle size={12} /> {enrollment.nextLiveAt ? `Next live ${formatDate(enrollment.nextLiveAt)}` : 'No live class scheduled'}</p>
                    {enrollment.expiresAt && <p className="text-amber-600 dark:text-amber-300">Access until {formatDate(enrollment.expiresAt)}</p>}
                  </div>
                  <div className="mt-auto pt-4">
                    <LinkButton to={`/dashboard/learning/${enrollment.course.id}`} size="sm" className="w-full" icon={<ArrowRight size={13} />}>
                      {enrollment.progressPercent > 0 ? 'Continue course' : 'Start course'}
                    </LinkButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
