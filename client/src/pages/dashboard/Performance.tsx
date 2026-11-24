import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, BookOpen, Clock3, Target, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Performance } from '../../lib/types';
import { EmptyState, ErrorState, LinkButton, PageLoader, Progress, SectionHeading, StatCard } from '../../components/ui';
import { BarChart, LineChart } from '../../components/charts';
import { formatDate, formatDuration, percent } from '../../lib/format';
import { courseTheme } from '../../lib/theme';

export function PerformancePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['learning-performance'],
    queryFn: () => api.get<Performance>('/learning/performance'),
  });

  if (isLoading) return <PageLoader label="Building your performance report" />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const results = data.results;
  const averageAccuracy = results.length
    ? results.reduce((sum, result) => sum + result.accuracy, 0) / results.length
    : null;
  const averagePercent = results.length
    ? results.reduce((sum, result) => sum + result.percent, 0) / results.length
    : null;
  const ranked = results.filter((result) => result.rank !== null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Analytics" title="Performance" description="Built from your submitted attempts, subject breakdowns and lecture progress." className="mb-0" />
        <LinkButton to="/dashboard/results" variant="secondary" icon={<Trophy size={14} />}>All results</LinkButton>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tests submitted" value={results.length} icon={<BarChart3 size={18} />} hint={`${ranked.length} ranked ${ranked.length === 1 ? 'attempt' : 'attempts'}`} />
        <StatCard label="Average score" value={averagePercent !== null ? percent(averagePercent, 1) : '—'} icon={<Target size={18} />} tone="success" hint="Across all submitted tests" />
        <StatCard label="Average accuracy" value={averageAccuracy !== null ? percent(averageAccuracy, 1) : '—'} icon={<TrendingUp size={18} />} tone="info" hint="Attempted questions only" />
        <StatCard label="Study time" value={formatDuration(data.studyTimeSeconds)} icon={<Clock3 size={18} />} tone="violet" hint={`${data.lecturesWatched} lectures watched`} />
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<BarChart3 size={22} />}
          title="Your analytics start with a test"
          description="Attempt a test to unlock score trends, subject accuracy and weak-topic signals."
          action={<LinkButton to="/tests">Browse tests</LinkButton>}
        />
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <section className="card p-5">
              <SectionHeading eyebrow="Trend" title="Score percentage over time" />
              <LineChart
                data={results.map((result) => ({
                  label: formatDate(result.createdAt, { day: 'numeric', month: 'short' }),
                  value: result.percent,
                }))}
                suffix="%"
              />
              <p className="mt-2 text-[11px] text-ink-muted">Each point is an actual submitted attempt, in chronological order.</p>
            </section>

            <section className="card p-5">
              <SectionHeading eyebrow="Subject accuracy" title="Correct share per subject" />
              <BarChart data={data.subjects.map((subject) => ({ label: subject.subject, value: subject.accuracy }))} />
              <p className="mt-3 text-[11px] text-ink-muted">Accuracy = correct ÷ attempted. Unattempted questions are excluded.</p>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><TrendingDown size={16} className="text-danger" /> Priority subjects</p>
              <p className="mt-1 text-xs text-ink-muted">Lowest accuracy first — the strongest candidates for your next revision block.</p>
              <div className="mt-3 space-y-2">
                {data.weakSubjects.length === 0 ? (
                  <p className="text-xs text-ink-muted">Not enough subject data yet.</p>
                ) : data.weakSubjects.map((subject) => (
                  <div key={subject.subject} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-xs">
                    <span className="font-medium text-ink">{subject.subject}</span>
                    <span className="font-semibold text-red-500">{percent(subject.accuracy, 1)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><TrendingUp size={16} className="text-success" /> Strengths</p>
              <p className="mt-1 text-xs text-ink-muted">Highest accuracy subjects — keep them warm with spaced practice.</p>
              <div className="mt-3 space-y-2">
                {data.strongSubjects.length === 0 ? (
                  <p className="text-xs text-ink-muted">Not enough subject data yet.</p>
                ) : data.strongSubjects.map((subject) => (
                  <div key={subject.subject} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-xs">
                    <span className="font-medium text-ink">{subject.subject}</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">{percent(subject.accuracy, 1)}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="card p-5">
            <SectionHeading eyebrow="History" title="All submitted results" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="py-2 pr-3">Test</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Score</th>
                    <th className="px-3 py-2">Accuracy</th>
                    <th className="px-3 py-2">Rank</th>
                    <th className="py-2 pl-3 text-right">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[...results].reverse().map((result) => (
                    <tr key={result.id}>
                      <td className="py-2.5 pr-3 font-medium text-ink">{result.testTitle}</td>
                      <td className="px-3 py-2.5 text-ink-muted">{formatDate(result.createdAt)}</td>
                      <td className="px-3 py-2.5 font-semibold text-ink">{result.score}/{result.maxMarks} <span className="font-normal text-ink-muted">({result.percent}%)</span></td>
                      <td className="px-3 py-2.5 text-ink-soft">{percent(result.accuracy, 1)}</td>
                      <td className="px-3 py-2.5 text-ink-soft">{result.rank ? `#${result.rank}` : '—'}{result.percentile !== null ? ` · ${result.percentile} %ile` : ''}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <Link to={`/dashboard/results/${result.id}`} className="inline-flex items-center gap-1 font-semibold text-brand-strong">
                          Analyse <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      <section>
        <SectionHeading eyebrow="Courses" title="Curriculum progress" />
        {data.enrollments.length === 0 ? (
          <EmptyState icon={<BookOpen size={20} />} title="No active enrolments" description="Enrol in a course to track lecture completion here." action={<LinkButton to="/courses" size="sm" variant="secondary">Explore courses</LinkButton>} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.enrollments.map((enrollment) => {
              const theme = courseTheme(enrollment.theme);
              return (
                <Link key={enrollment.id} to={`/dashboard/learning/${enrollment.id}`} className="card card-hover flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: theme.gradient }}>
                    <BookOpen size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{enrollment.title}</p>
                    <p className="text-[11px] text-ink-muted">{enrollment.completedCount}/{enrollment.lectureCount} lectures</p>
                    <Progress value={enrollment.progressPercent} size="sm" className="mt-1.5" />
                  </div>
                  <span className="text-xs font-bold text-ink">{enrollment.progressPercent}%</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
