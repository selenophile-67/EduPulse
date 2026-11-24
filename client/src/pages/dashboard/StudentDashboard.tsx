import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, BarChart3, BookOpen, Clock3, FileText, Flame, PlayCircle, Trophy, Video,
} from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { StudentDashboard } from '../../lib/types';
import {
  Alert, EmptyState, ErrorState, LinkButton, Progress, SectionHeading, Skeleton, StatCard,
} from '../../components/ui';
import { courseTheme } from '../../lib/theme';
import { formatDate, formatDuration, formatTime, percent } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { LiveClassCard, TestCard, ResultRow } from '../../components/cards';

export function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['learning-overview'],
    queryFn: () => api.get<StudentDashboard>('/learning/overview'),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const { stats, enrollments, upcomingLive, availableTests, recentResults } = data;
  const firstName = user?.name.split(' ')[0] || 'there';
  const nextSession = upcomingLive[0];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-7">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-brand/25 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Student workspace</p>
            <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome back, {firstName}.</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/60">
              {stats.activeCourses > 0
                ? `You have ${stats.activeCourses} active ${stats.activeCourses === 1 ? 'course' : 'courses'}. ${stats.streakDays > 0 ? `Your learning streak is ${stats.streakDays} days.` : 'Complete a lecture today to start a streak.'}`
                : 'Start with a free course to unlock lectures, tests and performance analytics.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton to="/courses" size="sm" variant="white">Explore courses</LinkButton>
              <Link to="/dashboard/performance" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-brand hover:text-white">
                <BarChart3 size={13} /> View performance
              </Link>
            </div>
          </div>
          {nextSession && (
            <Link to="/live-classes" className="group block w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-brand/40">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" /> Next live
                </span>
                <ArrowRight size={14} className="text-white/40 transition group-hover:text-white" />
              </div>
              <p className="mt-2 truncate text-sm font-semibold">{nextSession.title}</p>
              <p className="mt-0.5 text-[11px] text-white/50">{formatDate(nextSession.scheduledStart)} · {formatTime(nextSession.scheduledStart)}</p>
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active courses" value={stats.activeCourses} icon={<BookOpen size={18} />} hint={`${stats.lecturesCompleted} lectures completed`} />
        <StatCard label="Watch time" value={formatDuration(stats.watchSeconds)} icon={<Clock3 size={18} />} tone="info" hint="Recorded lecture progress" />
        <StatCard label="Tests taken" value={stats.testsTaken} icon={<FileText size={18} />} tone="violet" hint={stats.avgAccuracy !== null ? `${percent(stats.avgAccuracy, 1)} average accuracy` : 'No test results yet'} />
        <StatCard label="Study streak" value={`${stats.streakDays} days`} icon={<Flame size={18} />} tone="amber" hint={stats.attendancePercent !== null ? `${stats.attendancePercent}% live attendance` : 'Attendance appears after live classes'} />
      </div>

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<GraduationCapIcon />}
          title="Your learning shelf is empty"
          description="Enrol in a free course to get recorded lectures, study materials, tests and progress tracking."
          action={<LinkButton to="/courses" icon={<ArrowRight size={15} />}>Find your first course</LinkButton>}
        />
      ) : (
        <section>
          <SectionHeading eyebrow="Continue" title="Pick up where you left off" action={<Link to="/dashboard/learning" className="text-xs font-semibold text-brand-strong">My learning <ArrowRight size={12} className="inline" /></Link>} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enrollments.slice(0, 6).map((enrollment) => {
              const theme = courseTheme(enrollment.course.theme);
              return (
                <div key={enrollment.enrollmentId} className="card overflow-hidden">
                  <div className="relative p-4 text-white" style={{ background: theme.gradient }}>
                    <div className="bg-dots absolute inset-0 opacity-20" />
                    <div className="relative">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">{enrollment.course.exam} · {enrollment.course.level}</p>
                      <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug">{enrollment.course.title}</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between text-[11px] text-ink-muted">
                      <span>{enrollment.completedCount}/{enrollment.lectureCount} lectures</span>
                      <span className="font-semibold text-ink">{enrollment.progressPercent}%</span>
                    </div>
                    <Progress value={enrollment.progressPercent} className="mt-2" tone={enrollment.progressPercent >= 100 ? 'success' : 'brand'} />
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-ink-muted">{enrollment.nextLiveAt ? `Live ${formatDate(enrollment.nextLiveAt)}` : 'No upcoming live'}</span>
                      <LinkButton to={`/dashboard/learning/${enrollment.course.id}`} size="sm" variant="secondary" icon={<PlayCircle size={13} />}>
                        {enrollment.progressPercent > 0 ? 'Resume' : 'Start'}
                      </LinkButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <SectionHeading eyebrow="Live classes" title="Coming up" action={<Link to="/live-classes" className="text-xs font-semibold text-brand-strong">All sessions</Link>} />
          {upcomingLive.length === 0 ? (
            <EmptyState icon={<Video size={20} />} title="No live classes scheduled" description="Your educators' upcoming sessions will appear here." />
          ) : (
            <div className="space-y-3">
              {upcomingLive.slice(0, 3).map((session) => <LiveClassCard key={session.id} session={session} compact />)}
            </div>
          )}
        </section>

        <section>
          <SectionHeading eyebrow="Tests" title="Recommended next" action={<Link to="/tests" className="text-xs font-semibold text-brand-strong">Test series</Link>} />
          {availableTests.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} title="No open tests right now" description="New tests appear when educators publish them." action={<LinkButton to="/tests" size="sm" variant="secondary">Browse test series</LinkButton>} />
          ) : (
            <div className="space-y-3">
              {availableTests.slice(0, 2).map((test) => <TestCard key={test.id} test={test} />)}
            </div>
          )}
        </section>
      </div>

      <section>
        <SectionHeading eyebrow="Results" title="Recent performance" action={<Link to="/dashboard/results" className="text-xs font-semibold text-brand-strong">All results</Link>} />
        {recentResults.length === 0 ? (
          <EmptyState icon={<Trophy size={20} />} title="No results yet" description="Attempt a test to see your score, accuracy and subject breakdown." action={<LinkButton to="/tests" size="sm" variant="secondary">Take a test</LinkButton>} />
        ) : (
          <div className="space-y-2.5">
            {recentResults.map((result) => (
              <ResultRow
                key={result.id}
                title={result.testTitle}
                exam={result.exam}
                score={result.score}
                maxMarks={result.maxMarks}
                accuracy={result.accuracy}
                rank={result.rank}
                percentile={result.percentile}
                date={result.createdAt}
                link={`/dashboard/results/${result.id}`}
              />
            ))}
          </div>
        )}
      </section>

      {stats.attendancePercent === null && enrollments.length > 0 && (
        <Alert tone="info" title="Live attendance will appear here">
          Attendance is measured against live classes that have already ended in your enrolled courses.
        </Alert>
      )}
    </div>
  );
}

function GraduationCapIcon() {
  return <BookOpen size={22} />;
}
