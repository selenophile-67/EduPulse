import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BarChart3, ClipboardList, Target, Trophy } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { MyAttempt } from '../../lib/types';
import { EmptyState, ErrorState, LinkButton, PageLoader, SectionHeading, StatCard } from '../../components/ui';
import { ResultRow } from '../../components/cards';
import { percent } from '../../lib/format';

export function ResultsListPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-attempts'],
    queryFn: () => api.get<{ attempts: MyAttempt[] }>('/tests/my-attempts'),
  });

  const results = (data?.attempts || []).filter((attempt) => attempt.status !== 'in_progress' && attempt.resultId);
  const percentages = results.map((attempt) => attempt.maxMarks ? (attempt.score || 0) / attempt.maxMarks * 100 : 0);
  const best = percentages.length ? Math.max(...percentages) : null;
  const average = percentages.length ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length : null;
  const accuracies = results.map((attempt) => attempt.accuracy).filter((value): value is number => value !== null);
  const accuracy = accuracies.length ? accuracies.reduce((sum, value) => sum + value, 0) / accuracies.length : null;
  const ranked = results.filter((attempt) => attempt.rank !== null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Performance" title="My results" description="Every submitted attempt with scores, accuracy and analysis." className="mb-0" />
        <LinkButton to="/dashboard/performance" variant="secondary" icon={<BarChart3 size={14} />}>Performance dashboard</LinkButton>
      </div>

      {isLoading ? (
        <PageLoader label="Loading results" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : results.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22} />}
          title="No submitted results yet"
          description="Your scores appear here as soon as a test attempt is submitted."
          action={<LinkButton to="/tests">Take a test</LinkButton>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Tests submitted" value={results.length} icon={<ClipboardList size={18} />} />
            <StatCard label="Best score" value={best !== null ? percent(best, 1) : '—'} icon={<Trophy size={18} />} tone="success" />
            <StatCard label="Average score" value={average !== null ? percent(average, 1) : '—'} icon={<BarChart3 size={18} />} tone="info" />
            <StatCard label="Average accuracy" value={accuracy !== null ? percent(accuracy, 1) : '—'} icon={<Target size={18} />} tone="violet" hint={`${ranked.length} ranked ${ranked.length === 1 ? 'attempt' : 'attempts'}`} />
          </div>

          <div className="space-y-2.5">
            {results.map((attempt) => (
              <ResultRow
                key={attempt.id}
                title={attempt.testTitle}
                exam={attempt.exam}
                score={attempt.score ?? 0}
                maxMarks={attempt.maxMarks}
                accuracy={attempt.accuracy ?? 0}
                rank={attempt.rank}
                percentile={attempt.percentile}
                date={attempt.submittedAt || attempt.startedAt}
                link={attempt.resultId ? `/dashboard/results/${attempt.resultId}` : undefined}
              />
            ))}
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <Trophy size={12} /> Rank and percentile reflect this cohort. A percentile is withheld if you are the only submitted attempt.
            <Link to="/dashboard/performance" className="ml-1 inline-flex items-center gap-0.5 font-semibold text-brand-strong">See trends <ArrowRight size={11} /></Link>
          </p>
        </>
      )}
    </div>
  );
}
