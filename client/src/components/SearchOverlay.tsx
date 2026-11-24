import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, FileText, Search, Video, X, UserRound, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useDebounced } from '../hooks/useDebounced';
import type { SearchResults } from '../lib/types';
import { formatDuration } from '../lib/format';

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [term, setTerm] = useState('');
  const debounced = useDebounced(term, 220);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['search-suggest', debounced],
    queryFn: () => api.get<SearchResults>(`/search?q=${encodeURIComponent(debounced)}`),
    enabled: open && debounced.trim().length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setTerm('');
  }, [open]);

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!term.trim()) return;
    go(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const hasResults = data && (data.totals.courses + data.totals.educators + data.totals.materials + data.totals.tests + data.totals.lectures > 0);

  return (
    <div className="fixed inset-0 z-[80] flex justify-center px-4 pt-[8vh] sm:pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search EduPulse">
      <div className="absolute inset-0 bg-navy/65 backdrop-blur-sm" onClick={onClose} />
      <div className="animate-fade-up relative w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-line px-4 py-3.5">
          <Search size={18} className="shrink-0 text-ink-muted" />
          <input
            ref={inputRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search courses, educators, tests, notes…"
            className="flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
          {isFetching && <Loader2 size={16} className="animate-spin text-brand" />}
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-ink" aria-label="Close search">
            <X size={17} />
          </button>
        </form>

        <div className="max-h-[62vh] overflow-y-auto p-3">
          {debounced.trim().length < 2 ? (
            <div className="px-3 py-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Popular right now</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['JEE Physics', 'NEET Biology', 'UPSC Polity', 'SSC Quant', 'GATE Algorithms', 'Class 10 Science'].map((item) => (
                  <button
                    key={item}
                    onClick={() => setTerm(item)}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand-strong"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : !hasResults && !isFetching ? (
            <div className="px-3 py-10 text-center">
              <p className="text-sm font-medium text-ink">No matches for “{debounced}”</p>
              <p className="mt-1 text-xs text-ink-muted">Try a subject, exam name or educator.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {data?.courses.map((course) => (
                <button key={course.id} onClick={() => go(`/courses/${course.slug}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong dark:bg-brand/10"><BookOpen size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{course.title}</span>
                    <span className="block text-[11px] text-ink-muted">Course · {course.exam}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-ink-muted" />
                </button>
              ))}
              {data?.educators.map((educator) => (
                <button key={educator.id} onClick={() => go(`/search?q=${encodeURIComponent(educator.name)}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-soft"><UserRound size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{educator.name}</span>
                    <span className="block truncate text-[11px] text-ink-muted">Educator · {educator.headline || educator.subjects || 'EduPulse faculty'}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-ink-muted" />
                </button>
              ))}
              {data?.tests.map((test) => (
                <button key={test.id} onClick={() => go(`/tests/${test.id}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10"><FileText size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{test.title}</span>
                    <span className="block text-[11px] text-ink-muted">Test · {test.exam} · {test.questionCount} questions</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-ink-muted" />
                </button>
              ))}
              {data?.materials.map((material) => (
                <button key={material.id} onClick={() => go(`/materials?highlight=${material.id}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10"><FileText size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{material.title}</span>
                    <span className="block text-[11px] text-ink-muted">Material · {material.exam}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-ink-muted" />
                </button>
              ))}
              {data?.lectures.map((lecture) => (
                <button key={lecture.id} onClick={() => go(`/courses/${lecture.courseSlug}`)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-surface-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"><Video size={16} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{lecture.title}</span>
                    <span className="block truncate text-[11px] text-ink-muted">Lecture · {lecture.courseTitle} · {formatDuration(lecture.durationSeconds)}</span>
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-ink-muted" />
                </button>
              ))}
              {term.trim() && (
                <button onClick={submit} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-surface-2 px-3 py-2.5 text-xs font-semibold text-ink-soft hover:text-ink">
                  See all results for “{term.trim()}” <ArrowRight size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
