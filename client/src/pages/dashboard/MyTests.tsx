import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ClipboardList, FileText, PlayCircle, RotateCcw, Trophy } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { MyAttempt, StudentDashboard } from '../../lib/types';
import { Badge, EmptyState, ErrorState, LinkButton, PageLoader, SectionHeading, Tabs } from '../../components/ui';
import { TestCard } from '../../components/cards';
import { formatDateTime, formatDuration, percent } from '../../lib/format';

type Tab = 'attempts' | 'available';

function statusTone(status: string) {
  if (status === 'in_progress') return 'warning' as const;
  if (status === 'submitted') return 'success' as const;
  return 'neutral' as const;
}

export function MyTestsPage() {
  const [tab, setTab] = useState<Tab>('attempts');
  const attemptsQuery = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => api.get<{ attempts: MyAttempt[] }>('/tests/my-attempts'),
  });
  const overviewQuery = useQuery({
    queryKey: ['learning-overview'],
    queryFn: () => api.get<StudentDashboard>('/learning/overview'),
  });

  const attempts = attemptsQuery.data?.attempts || [];
  const available = overviewQuery.data?.availableTests || [];
  const inProgress = attempts.filter((attempt) => attempt.status === 'in_progress');
  const submitted = attempts.filter((attempt) => attempt.status !== 'in_progress');

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Assessments" title="My tests" description="Attempts, scores and result analysis tied to your account." className="mb-0" />
        <LinkButton to="/tests" variant="secondary" icon={<ArrowRight size={14} />}>Test series</LinkButton>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'attempts', label: 'My attempts', count: attempts.length },
          { value: 'available', label: 'Recommended', count: available.length },
        ]}
      />

      {tab === 'attempts' && (
        <>
          {attemptsQuery.isLoading ? (
            <PageLoader label="Loading attempts" />
          ) : attemptsQuery.error ? (
            <ErrorState message={errorMessage(attemptsQuery.error)} onRetry={() => attemptsQuery.refetch()} />
          ) : attempts.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={22} />}
              title="You have not attempted a test yet"
              description="Start with a free full-length or chapter test. Solutions unlock after you submit."
              action={<LinkButton to="/tests">Browse tests</LinkButton>}
            />
          ) : (
            <div className="space-y-5">
              {inProgress.length > 0 && (
                <div className="card border-brand/30 bg-brand-soft/40 p-4 dark:bg-brand/10">
                  <p className="text-sm font-semibold text-ink">Attempts in progress</p>
                  <div className="mt-2 space-y-2">
                    {inProgress.map((attempt) => (
                      <div key={attempt.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-ink">{attempt.testTitle}</p>
                          <p className="text-[11px] text-ink-muted">{attempt.exam} · started {formatDateTime(attempt.startedAt)}</p>
                        </div>
                        <LinkButton to={`/attempts/${attempt.id}`} size="sm" icon={<PlayCircle size={13} />}>Resume</LinkButton>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card overflow-hidden">
                <div className="hidden border-b border-line bg-surface-2/60 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted sm:grid sm:grid-cols-[1fr_100px_90px_90px_120px]">
                  <span>Test</span><span>Score</span><span>Accuracy</span><span>Rank</span><span className="text-right">Action</span>
                </div>
                <div className="divide-y divide-line">
                  {submitted.map((attempt) => (
                    <div key={attempt.id} className="flex flex-col gap-2 px-4 py-3 sm:grid sm:grid-cols-[1fr_100px_90px_90px_120px] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">{attempt.testTitle}</p>
                        <p className="text-[11px] text-ink-muted">
                          {attempt.exam} · {formatDateTime(attempt.submittedAt)} · {attempt.timeTakenSeconds ? formatDuration(attempt.timeTakenSeconds) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 sm:contents">
                        <div>
                          <p className="text-xs font-bold text-ink">{attempt.score ?? 0}/{attempt.maxMarks}</p>
                          <p className="text-[10px] text-ink-muted sm:hidden">Score</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink">{percent(attempt.accuracy)}</p>
                          <p className="text-[10px] text-ink-muted sm:hidden">Accuracy</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-ink">{attempt.rank ? `#${attempt.rank}` : '—'}</p>
                          <p className="text-[10px] text-ink-muted sm:hidden">Rank</p>
                        </div>
                        <div className="sm:col-start-5 sm:justify-self-end">
                          {attempt.resultId ? (
                            <Link to={`/dashboard/results/${attempt.resultId}`} className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft hover:border-brand hover:text-brand-strong">
                              Analysis <ArrowRight size={11} />
                            </Link>
                          ) : (
                            <Badge tone={statusTone(attempt.status)}>{attempt.status.replace('_', ' ')}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
                <span className="inline-flex items-center gap-1"><Trophy size={12} /> Rank is cohort-specific; percentile is withheld for single attempts.</span>
                <Link to="/tests" className="inline-flex items-center gap-1 font-semibold text-brand-strong"><RotateCcw size={12} /> Take another test</Link>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'available' && (
        overviewQuery.isLoading ? (
          <PageLoader label="Loading recommended tests" />
        ) : overviewQuery.error ? (
          <ErrorState message={errorMessage(overviewQuery.error)} onRetry={() => overviewQuery.refetch()} />
        ) : available.length === 0 ? (
          <EmptyState icon={<FileText size={22} />} title="No open tests to recommend" description="New tests appear when educators publish them or when you enrol in a course." action={<LinkButton to="/tests" variant="secondary">Browse test series</LinkButton>} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {available.map((test) => <TestCard key={test.id} test={test} />)}
          </div>
        )
      )}
    </div>
  );
}
