import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, BookOpen, FileText, GraduationCap, Loader2, PlayCircle, Search, Users, Video, X,
} from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import type { SearchResults } from '../lib/types';
import { Avatar, Badge, Button, EmptyState, ErrorState, LinkButton, PageLoader, SectionHeading } from '../components/ui';
import { CourseCard, TestCard } from '../components/cards';
import { formatDuration } from '../lib/format';
import { useDebounced } from '../hooks/useDebounced';

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const [term, setTerm] = useState(q);
  const debounced = useDebounced(term, 300);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['search-page', q],
    queryFn: () => api.get<SearchResults>(`/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (debounced.trim()) next.set('q', debounced.trim());
    else next.delete('q');
    setParams(next);
  };

  const total = data ? data.totals.courses + data.totals.educators + data.totals.materials + data.totals.tests + data.totals.lectures : 0;

  return (
    <div className="bg-page">
      <section className="border-b border-line bg-navy text-white">
        <div className="container-x py-10 lg:py-14">
          <h1 className="font-display text-3xl font-extrabold tracking-tight">Search EduPulse</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/60">Courses, educators, tests, materials and lectures — searched live against the catalogue.</p>
          <form onSubmit={submit} className="mt-6 flex max-w-2xl gap-2">
            <div className="relative flex-1">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Try “rotational motion”, “NEET”, “algebra”…"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-10 text-sm text-white outline-none placeholder:text-white/40 focus:border-brand focus:ring-4 focus:ring-brand/20"
                aria-label="Search catalogue"
              />
              {term && (
                <button type="button" onClick={() => setTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white" aria-label="Clear search">
                  <X size={15} />
                </button>
              )}
            </div>
            <Button type="submit" size="lg" icon={isFetching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}>Search</Button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-white/50">
            <span>Popular:</span>
            {['JEE', 'NEET', 'UPSC', 'GATE', 'Banking'].map((item) => (
              <button key={item} onClick={() => { setTerm(item); const next = new URLSearchParams(params); next.set('q', item); setParams(next); }} className="rounded-full border border-white/10 px-2.5 py-1 text-white/70 hover:border-brand hover:text-white">
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x py-8 lg:py-10">
        {q.trim().length < 2 ? (
          <EmptyState
            icon={<Search size={22} />}
            title="Start typing to search"
            description="Enter at least two characters. Results are grouped by courses, educators, tests, materials and lectures."
            action={<LinkButton to="/courses" variant="secondary">Browse all courses</LinkButton>}
          />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : isFetching && !data ? (
          <PageLoader label={`Searching for “${q}”`} />
        ) : !data || total === 0 ? (
          <EmptyState
            icon={<Search size={22} />}
            title={`No results for “${q}”`}
            description="Check the spelling or try a broader term like an exam name or subject."
            action={<LinkButton to="/courses" variant="secondary">Browse courses</LinkButton>}
          />
        ) : (
          <div className="space-y-10">
            <p className="text-sm text-ink-muted">
              <span className="font-semibold text-ink">{total}</span> results for <span className="font-semibold text-ink">“{q}”</span>
            </p>

            {data.courses.length > 0 && (
              <section>
                <SectionHeading eyebrow="Courses" title={`${data.totals.courses} matching courses`} action={<Link to={`/courses?q=${encodeURIComponent(q)}`} className="text-xs font-semibold text-brand-strong">Open in course explorer <ArrowRight size={12} className="inline" /></Link>} />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.courses.map((course) => <CourseCard key={course.id} course={course} />)}
                </div>
              </section>
            )}

            {data.tests.length > 0 && (
              <section>
                <SectionHeading eyebrow="Tests" title={`${data.totals.tests} matching tests`} />
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.tests.map((test) => <TestCard key={test.id} test={test} />)}
                </div>
              </section>
            )}

            {data.materials.length > 0 && (
              <section>
                <SectionHeading eyebrow="Study materials" title={`${data.totals.materials} matching materials`} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.materials.map((material) => (
                    <Link key={material.id} to={`/materials?highlight=${material.id}`} className="card card-hover flex items-center gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300"><FileText size={18} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{material.title}</p>
                        <p className="truncate text-[11px] text-ink-muted">{material.exam}{material.subject ? ` · ${material.subject}` : ''} · {material.isPremium ? 'Premium' : 'Free'}</p>
                      </div>
                      <ArrowRight size={14} className="shrink-0 text-ink-muted" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {data.lectures.length > 0 && (
              <section>
                <SectionHeading eyebrow="Lectures" title={`${data.totals.lectures} matching lectures`} />
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.lectures.map((lecture) => (
                    <Link key={lecture.id} to={`/courses/${lecture.courseSlug}`} className="card card-hover flex items-center gap-3 p-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"><PlayCircle size={18} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{lecture.title}</p>
                        <p className="truncate text-[11px] text-ink-muted">{lecture.courseTitle} · {formatDuration(lecture.durationSeconds)}</p>
                      </div>
                      <ArrowRight size={14} className="shrink-0 text-ink-muted" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {data.educators.length > 0 && (
              <section>
                <SectionHeading eyebrow="Educators" title={`${data.totals.educators} matching educators`} />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.educators.map((educator) => (
                    <div key={educator.id} className="card flex items-start gap-3 p-4">
                      <Avatar name={educator.name} color={educator.avatarColor} size={42} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{educator.name}</p>
                        <p className="line-clamp-2 text-[11px] leading-relaxed text-ink-muted">{educator.headline || 'EduPulse educator'}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone="neutral"><BookOpen size={10} /> {educator.courseCount} courses</Badge>
                          <Badge tone="neutral"><Users size={10} /> {educator.studentCount}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="card flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-info dark:bg-blue-500/10"><GraduationCap size={20} /></span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">Looking for a full study plan?</p>
                <p className="mt-0.5 text-xs text-ink-muted">Browse the structured courses that combine lectures, materials, live classes and tests.</p>
              </div>
              <LinkButton to="/courses" size="sm" icon={<Video size={14} />}>Explore courses</LinkButton>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
