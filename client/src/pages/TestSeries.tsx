import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList, FileCheck2, Search, Timer, Trophy } from 'lucide-react';
import { api, errorMessage, queryString } from '../lib/api';
import type { Paginated, Test } from '../lib/types';
import { ErrorState, EmptyState, Pagination, SectionHeading, Select, SkeletonCards, Tabs } from '../components/ui';
import { TestCard } from '../components/cards';
import { testTypeLabel } from '../lib/format';
import { useAuth } from '../context/AuthContext';

interface TestMeta {
  exams: { exam: string; count: number }[];
  types: { type: string; count: number }[];
}

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most attempted' },
];

export function TestSeriesPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const page = Number(params.get('page') || 1);
  const values = {
    q: params.get('q') || '',
    exam: params.get('exam') || '',
    type: params.get('type') || '',
    sort: params.get('sort') || 'newest',
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const { data: meta } = useQuery({
    queryKey: ['test-meta'],
    queryFn: () => api.get<TestMeta>('/tests/meta'),
    staleTime: 300_000,
  });

  const payload = { ...values, page, limit: 12 };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tests', payload, Boolean(user)],
    queryFn: () => api.get<Paginated<Test>>(`/tests${queryString(payload)}`),
  });

  return (
    <div className="bg-page">
      <section className="relative overflow-hidden border-b border-line bg-navy text-white">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="container-x relative py-12 lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80">
            <ClipboardList size={12} /> Test series &amp; mock exams
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Practice with real exam conditions. See your real rank.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
            Every test is timed and scored on the server with negative marking. Rank and percentile appear only after other candidates submit — never simulated.
          </p>
          <div className="mt-7 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: FileCheck2, label: 'Server-scored', value: 'Auto evaluation' },
              { icon: Timer, label: 'Timer', value: 'Auto-submit on expiry' },
              { icon: Trophy, label: 'Ranking', value: 'Real cohort rank' },
              { icon: Search, label: 'Solutions', value: 'Per-question review' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <item.icon size={16} className="text-brand" />
                <p className="mt-2 text-[11px] font-semibold text-white/80">{item.label}</p>
                <p className="mt-0.5 text-[10px] text-white/50">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x py-8 lg:py-10">
        <div className="card mb-6 flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-wrap gap-2">
            <Tabs
              value={values.exam}
              onChange={(value) => setParam('exam', value)}
              tabs={[
                { value: '', label: 'All exams' },
                ...(meta?.exams || []).map((exam) => ({ value: exam.exam, label: exam.exam, count: exam.count })),
              ]}
              className="bg-transparent p-0"
            />
          </div>
          <div className="flex gap-2">
            <Select value={values.type} onChange={(event) => setParam('type', event.target.value)} aria-label="Filter by test type" className="h-9 w-40 text-xs">
              <option value="">All types</option>
              {(meta?.types || []).map((type) => (
                <option key={type.type} value={type.type}>{testTypeLabel(type.type)} ({type.count})</option>
              ))}
            </Select>
            <Select value={values.sort} onChange={(event) => setParam('sort', event.target.value)} aria-label="Sort tests" className="h-9 w-36 text-xs">
              {SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
            </Select>
          </div>
        </div>

        <SectionHeading
          eyebrow={values.exam ? `${values.exam} tests` : 'All tests'}
          title={`${data?.total ?? 0} published ${data?.total === 1 ? 'test' : 'tests'}`}
          description={user ? 'Your attempts are saved automatically. Resume anytime before the timer ends.' : 'Sign in to start an attempt — progress and scores are saved to your account.'}
        />

        {isLoading ? (
          <SkeletonCards count={6} />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No tests match these filters"
            description="Try a different exam or test type. New tests are published regularly."
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((test) => <TestCard key={test.id} test={test} />)}
            </div>
            <Pagination page={page} total={data.total} limit={data.limit} onPage={(next) => setParam('page', String(next))} />
          </>
        )}
      </div>
    </div>
  );
}
