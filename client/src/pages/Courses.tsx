import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { api, errorMessage, queryString } from '../lib/api';
import type { Category, Course, Paginated } from '../lib/types';
import { Button, ErrorState, EmptyState, Modal, Pagination, Select, SkeletonCards, Badge } from '../components/ui';
import { CourseCard, CategoryIcon } from '../components/cards';
import { CATEGORY_META } from '../lib/theme';
import { cn } from '../lib/cn';

interface Filters {
  categories: Category[];
  exams: { exam: string; course_count: number }[];
  languages: { language: string; course_count: number }[];
  levels: { level: string; course_count: number }[];
}

const SORTS = [
  { value: 'popular', label: 'Most popular' },
  { value: 'newest', label: 'Newest first' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'price-low', label: 'Price: low to high' },
  { value: 'price-high', label: 'Price: high to low' },
];

export function CoursesPage() {
  const [params, setParams] = useSearchParams();
  const [mobileFilters, setMobileFilters] = useState(false);
  const page = Number(params.get('page') || 1);
  const values = {
    q: params.get('q') || '',
    category: params.get('category') || '',
    exam: params.get('exam') || '',
    classLevel: params.get('classLevel') || '',
    level: params.get('level') || '',
    language: params.get('language') || '',
    price: params.get('price') || '',
    minRating: params.get('minRating') || '',
    teacher: params.get('teacher') || '',
    sort: params.get('sort') || 'popular',
  };

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: true });
  };

  const { data: filters } = useQuery({
    queryKey: ['course-filters'],
    queryFn: () => api.get<Filters>('/courses/filters'),
    staleTime: 300_000,
  });

  const searchPayload = { ...values, page, limit: 12 };
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['courses', searchPayload],
    queryFn: () => api.get<Paginated<Course>>(`/courses${queryString(searchPayload)}`),
  });

  const activeFilters = [
    values.category && { key: 'category', label: filters?.categories.find((c) => c.slug === values.category)?.name || values.category },
    values.exam && { key: 'exam', label: values.exam },
    values.level && { key: 'level', label: `${values.level} level` },
    values.language && { key: 'language', label: values.language },
    values.classLevel && { key: 'classLevel', label: values.classLevel },
    values.price && { key: 'price', label: values.price === 'free' ? 'Free' : 'Paid' },
    values.minRating && { key: 'minRating', label: `${values.minRating}+ rating` },
    values.q && { key: 'q', label: `“${values.q}”` },
  ].filter(Boolean) as { key: string; label: string }[];

  const filterPanel = (
    <div className="space-y-5">
      <div>
        <p className="label">Category</p>
        <div className="space-y-1">
          <button
            onClick={() => setParam('category', '')}
            className={cn('flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition', !values.category ? 'bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300' : 'text-ink-soft hover:bg-surface-2')}
          >
            All categories
            {filters && <span className="text-[10px] text-ink-muted">{filters.categories.reduce((sum, c) => sum + c.courseCount, 0)}</span>}
          </button>
          {filters?.categories.filter((c) => c.courseCount > 0).map((category) => (
            <button
              key={category.slug}
              onClick={() => setParam('category', category.slug)}
              className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition', values.category === category.slug ? 'bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300' : 'text-ink-soft hover:bg-surface-2')}
            >
              <CategoryIcon slug={category.slug} size={13} />
              <span className="flex-1 text-left">{category.name}</span>
              <span className="text-[10px] text-ink-muted">{category.courseCount}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Exam</p>
        <Select value={values.exam} onChange={(event) => setParam('exam', event.target.value)} aria-label="Filter by exam">
          <option value="">All exams</option>
          {filters?.exams.map((exam) => <option key={exam.exam} value={exam.exam}>{exam.exam} ({exam.course_count})</option>)}
        </Select>
      </div>

      <div>
        <p className="label">Level</p>
        <Select value={values.level} onChange={(event) => setParam('level', event.target.value)} aria-label="Filter by level">
          <option value="">Any level</option>
          {filters?.levels.map((level) => <option key={level.level} value={level.level}>{level.level} ({level.course_count})</option>)}
        </Select>
      </div>

      <div>
        <p className="label">Language</p>
        <Select value={values.language} onChange={(event) => setParam('language', event.target.value)} aria-label="Filter by language">
          <option value="">Any language</option>
          {filters?.languages.map((language) => <option key={language.language} value={language.language}>{language.language} ({language.course_count})</option>)}
        </Select>
      </div>

      <div>
        <p className="label">Pricing</p>
        <div className="grid grid-cols-3 gap-1.5">
          {[{ value: '', label: 'Any' }, { value: 'free', label: 'Free' }, { value: 'paid', label: 'Paid' }].map((option) => (
            <button
              key={option.value}
              onClick={() => setParam('price', option.value)}
              className={cn('rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition', values.price === option.value ? 'border-brand bg-brand-soft text-brand-strong dark:bg-brand/10' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink')}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Minimum rating</p>
        <div className="grid grid-cols-4 gap-1.5">
          {['', '4', '4.5', '4.8'].map((rating) => (
            <button
              key={rating}
              onClick={() => setParam('minRating', rating)}
              className={cn('rounded-lg border px-1 py-1.5 text-[11px] font-semibold transition', values.minRating === rating ? 'border-brand bg-brand-soft text-brand-strong dark:bg-brand/10' : 'border-line text-ink-muted hover:border-line-strong hover:text-ink')}
            >
              {rating ? `${rating}+` : 'Any'}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setParams(new URLSearchParams(values.sort !== 'popular' ? { sort: values.sort } : {}), { replace: true })} className="w-full rounded-lg border border-line py-2 text-xs font-semibold text-ink-soft hover:border-line-strong hover:text-ink">
        Reset all filters
      </button>
    </div>
  );

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-navy py-10 text-white">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="container-x relative">
          <nav className="text-[11px] text-white/45"><Link to="/" className="hover:text-white">Home</Link> <span className="mx-1">/</span> Courses</nav>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Explore courses</h1>
              <p className="mt-2 max-w-xl text-sm text-white/60">
                Filter by exam, level and pricing. Every course page lists its complete curriculum, tests and live schedule before you enroll.
              </p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                setParam('q', String(form.get('q') || ''));
              }}
              className="flex w-full max-w-md gap-2"
            >
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
                <input
                  name="q"
                  defaultValue={values.q}
                  placeholder="Search by title, exam, educator…"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3 text-sm text-white outline-none backdrop-blur placeholder:text-white/40 focus:border-brand focus:ring-4 focus:ring-brand/20"
                />
              </div>
              <Button type="submit" size="md">Search</Button>
            </form>
          </div>
        </div>
      </section>

      <div className="container-x py-8">
        <div className="grid gap-7 lg:grid-cols-[248px_1fr]">
          <aside className="hidden lg:block">
            <div className="card sticky top-20 p-4">{filterPanel}</div>
          </aside>

          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMobileFilters(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink-soft lg:hidden"
              >
                <SlidersHorizontal size={13} /> Filters
                {activeFilters.length > 0 && <span className="rounded-full bg-brand px-1.5 text-[10px] text-white">{activeFilters.length}</span>}
              </button>
              <div className="flex flex-1 flex-wrap items-center gap-1.5">
                {activeFilters.map((filter) => (
                  <button key={filter.key} onClick={() => setParam(filter.key, '')} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft hover:border-brand hover:text-brand-strong">
                    {filter.label} <X size={11} />
                  </button>
                ))}
                {activeFilters.length > 0 && (
                  <button onClick={() => setParams(new URLSearchParams(), { replace: true })} className="text-[11px] font-semibold text-brand-strong hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-[11px] text-ink-muted sm:inline">{data?.total ?? 0} courses</span>
                <Select value={values.sort} onChange={(event) => setParam('sort', event.target.value)} className="h-8 w-40 py-0 text-xs" aria-label="Sort courses">
                  {SORTS.map((sort) => <option key={sort.value} value={sort.value}>{sort.label}</option>)}
                </Select>
              </div>
            </div>

            {values.category && filters && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${CATEGORY_META[values.category]?.accent || '#f97316'}16`, color: CATEGORY_META[values.category]?.accent || '#f97316' }}
                  >
                    <CategoryIcon slug={values.category} size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-ink">{filters.categories.find((c) => c.slug === values.category)?.name}</p>
                    <p className="text-[11px] text-ink-muted">{filters.categories.find((c) => c.slug === values.category)?.tagline}</p>
                  </div>
                </div>
                <Badge tone="brand">{data?.total ?? 0} courses</Badge>
              </div>
            )}

            {isLoading ? (
              <SkeletonCards count={6} />
            ) : error ? (
              <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
            ) : !data?.items.length ? (
              <EmptyState
                title="No courses match these filters"
                description="Try clearing a filter or searching for a broader exam name."
                icon={<Filter size={22} />}
                action={<Button variant="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear filters</Button>}
              />
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {data.items.map((course) => <CourseCard key={course.id} course={course} />)}
                </div>
                <Pagination page={page} total={data.total} limit={12} onPage={(next) => setParam('page', String(next))} />
              </>
            )}
          </div>
        </div>
      </div>

      <Modal open={mobileFilters} onClose={() => setMobileFilters(false)} title="Filter courses" size="sm" footer={<Button className="w-full" onClick={() => setMobileFilters(false)}>Show {data?.total ?? 0} courses <ArrowRight size={14} /></Button>}>
        {filterPanel}
      </Modal>
    </div>
  );
}
