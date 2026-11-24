import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark, BookmarkCheck, Download, ExternalLink, FileText, Lock, Search, X,
} from 'lucide-react';
import { api, errorMessage, queryString } from '../lib/api';
import type { Material, MaterialDetail, Paginated } from '../lib/types';
import {
  Alert, Badge, Button, EmptyState, ErrorState, Modal, Pagination, Select, SkeletonCards,
} from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate, formatNumber } from '../lib/format';
import { cn } from '../lib/cn';

interface MaterialMeta {
  exams: { exam: string; count: number }[];
  categories: { category: string; count: number }[];
  subjects: { subject: string; count: number }[];
}

export function MaterialsPage() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') || '');
  const [openId, setOpenId] = useState<string | null>(params.get('highlight'));
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const page = Number(params.get('page') || 1);
  const filters = {
    q: params.get('q') || '',
    exam: params.get('exam') || '',
    category: params.get('category') || '',
    subject: params.get('subject') || '',
    premium: params.get('premium') || '',
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
    queryKey: ['material-meta'],
    queryFn: () => api.get<MaterialMeta>('/materials/meta'),
    staleTime: 300_000,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['materials', filters, page],
    queryFn: () => api.get<Paginated<Material>>(`/materials${queryString({ ...filters, page, limit: 12 })}`),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['material', openId],
    queryFn: () => api.get<MaterialDetail>(`/materials/${openId}`),
    enabled: Boolean(openId),
  });

  useEffect(() => {
    if (openId) {
      const next = new URLSearchParams(params);
      next.set('highlight', openId);
      setParams(next, { replace: true });
    }
  }, [openId]);

  const closeDetail = () => {
    setOpenId(null);
    const next = new URLSearchParams(params);
    next.delete('highlight');
    setParams(next, { replace: true });
  };

  const toggleBookmark = async (material: Material) => {
    if (!user) {
      toast.info('Sign in to save resources', 'Bookmarks sync across devices once you sign in.');
      return;
    }
    try {
      const result = await api.post<{ bookmarked: boolean }>('/bookmarks', { entityType: 'material', entityId: material.id });
      toast.success(result.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['material', material.id] });
    } catch (err) {
      toast.error('Could not update bookmark', errorMessage(err));
    }
  };

  const material = detail?.material;
  const locked = material ? (user ? material.canDownload === false : material.isPremium) : false;
  const fileUrl = material ? `/api/media/material/${material.id}` : '';

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line bg-navy py-10 text-white">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="absolute -right-24 top-0 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="container-x relative">
          <nav className="text-[11px] text-white/45"><Link to="/" className="hover:text-white">Home</Link> <span className="mx-1">/</span> Study materials</nav>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Study material library</h1>
              <p className="mt-2 max-w-xl text-sm text-white/60">
                Exam-focused notes, formula sheets and practice sets. Read in the browser or download the PDF.
              </p>
            </div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setParam('q', term.trim());
              }}
              className="flex w-full max-w-md gap-2"
            >
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/45" />
                <input
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  placeholder="Search notes, chapters, subjects…"
                  className="h-11 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3 text-sm text-white outline-none backdrop-blur placeholder:text-white/40 focus:border-brand focus:ring-4 focus:ring-brand/20"
                />
              </div>
              <Button type="submit">Search</Button>
            </form>
          </div>
        </div>
      </section>

      <div className="container-x py-8">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-surface-2 p-1">
            {[
              { value: '', label: 'All' },
              { value: 'free', label: 'Free' },
              { value: 'premium', label: 'Premium' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setParam('premium', option.value)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition', filters.premium === option.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink')}
              >
                {option.label}
              </button>
            ))}
          </div>
          <Select value={filters.exam} onChange={(event) => setParam('exam', event.target.value)} className="h-9 w-auto min-w-36 py-0 text-xs" aria-label="Filter by exam">
            <option value="">All exams</option>
            {meta?.exams.map((item) => <option key={item.exam} value={item.exam}>{item.exam} ({item.count})</option>)}
          </Select>
          <Select value={filters.category} onChange={(event) => setParam('category', event.target.value)} className="h-9 w-auto min-w-36 py-0 text-xs" aria-label="Filter by category">
            <option value="">All categories</option>
            {meta?.categories.map((item) => <option key={item.category} value={item.category}>{item.category} ({item.count})</option>)}
          </Select>
          <Select value={filters.subject} onChange={(event) => setParam('subject', event.target.value)} className="h-9 w-auto min-w-36 py-0 text-xs" aria-label="Filter by subject">
            <option value="">All subjects</option>
            {meta?.subjects.map((item) => <option key={item.subject} value={item.subject}>{item.subject} ({item.count})</option>)}
          </Select>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-ink-muted">{data?.total ?? 0} materials</span>
            <Select value={filters.sort} onChange={(event) => setParam('sort', event.target.value)} className="h-9 w-36 py-0 text-xs" aria-label="Sort">
              <option value="newest">Newest</option>
              <option value="popular">Most downloaded</option>
            </Select>
          </div>
        </div>

        {(filters.q || filters.exam || filters.category || filters.subject || filters.premium) && (
          <div className="mb-4 flex flex-wrap items-center gap-1.5">
            {Object.entries(filters).filter(([key, value]) => value && key !== 'sort').map(([key, value]) => (
              <button key={key} onClick={() => { setParam(key, ''); if (key === 'q') setTerm(''); }} className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                {key === 'q' ? `“${value}”` : value.replace('_', ' ')} <X size={11} />
              </button>
            ))}
            <button onClick={() => { setParams(new URLSearchParams(), { replace: true }); setTerm(''); }} className="text-[11px] font-semibold text-brand-strong hover:underline">Clear all</button>
          </div>
        )}

        {isLoading ? (
          <SkeletonCards count={9} />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : !data?.items.length ? (
          <EmptyState title="No materials found" description="Adjust the filters or search with a different keyword." action={<Button variant="secondary" onClick={() => { setParams(new URLSearchParams(), { replace: true }); setTerm(''); }}>Reset filters</Button>} />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => (
                <div key={item.id} id={`material-${item.id}`} className={cn('card card-hover group flex flex-col p-4', params.get('highlight') === item.id && 'ring-2 ring-brand/40')}>
                  <div className="flex items-start justify-between gap-2">
                    <button onClick={() => setOpenId(item.id)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand-strong transition group-hover:scale-105 dark:bg-brand/10 dark:text-orange-300" aria-label={`Open ${item.title}`}>
                      <FileText size={20} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {item.isPremium ? <Badge tone="warning"><Lock size={10} /> Premium</Badge> : <Badge tone="success">Free</Badge>}
                      <button onClick={() => toggleBookmark(item)} className="rounded-md p-1 text-ink-muted hover:bg-surface-2 hover:text-brand-strong" aria-label="Toggle bookmark">
                        {item.bookmarked ? <BookmarkCheck size={15} className="text-brand" /> : <Bookmark size={15} />}
                      </button>
                    </div>
                  </div>
                  <button onClick={() => setOpenId(item.id)} className="mt-3 text-left">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-strong">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">{item.description}</p>
                  </button>
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-ink-muted">
                    <span className="rounded bg-surface-2 px-1.5 py-0.5">{item.exam}</span>
                    {item.subject && <span className="rounded bg-surface-2 px-1.5 py-0.5">{item.subject}</span>}
                    {item.chapterName && <span className="rounded bg-surface-2 px-1.5 py-0.5">{item.chapterName}</span>}
                  </div>
                  {item.courseTitle && (
                    <Link to={`/courses`} className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-brand-strong hover:underline">
                      From {item.courseTitle} <ExternalLink size={9} />
                    </Link>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-[11px] text-ink-muted">
                    <span className="inline-flex items-center gap-1"><Download size={11} />{formatNumber(item.downloadCount)} downloads</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => setOpenId(item.id)}>Preview</Button>
                    {!item.isPremium || item.canDownload ? (
                      <a href={`/api/media/material/${item.id}${user ? '?download=1' : ''}`} target="_blank" rel="noreferrer" className="flex-1">
                        <Button size="sm" className="w-full"><Download size={13} /> Download</Button>
                      </a>
                    ) : (
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => setOpenId(item.id)}><Lock size={12} /> Unlock</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} total={data.total} limit={12} onPage={(next) => setParam('page', String(next))} />
          </>
        )}
      </div>

      <Modal
        open={Boolean(openId)}
        onClose={closeDetail}
        title={material?.title || 'Loading material…'}
        description={material ? `${material.exam}${material.subject ? ` · ${material.subject}` : ''}${material.chapterName ? ` · ${material.chapterName}` : ''}` : undefined}
        size="lg"
        footer={
          material ? (
            <>
              <Button variant="secondary" size="md" onClick={() => toggleBookmark(material)} icon={material.bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}>
                {material.bookmarked ? 'Saved' : 'Save'}
              </Button>
              {!locked ? (
                <a href={`${fileUrl}?download=1`} target="_blank" rel="noreferrer">
                  <Button size="md" icon={<Download size={14} />}>Download PDF</Button>
                </a>
              ) : (
                <Button size="md" onClick={() => { closeDetail(); toast.info('Enroll to unlock this resource', material.courseTitle ? `This resource is part of “${material.courseTitle}”.` : 'Premium resources unlock with an active enrollment.'); }}>
                  <Lock size={13} /> Unlock access
                </Button>
              )}
            </>
          ) : undefined
        }
      >
        {detailLoading ? (
          <div className="flex h-72 items-center justify-center text-sm text-ink-muted">Loading preview…</div>
        ) : material ? (
          <div className="space-y-3">
            {material.description && <p className="text-sm leading-relaxed text-ink-soft">{material.description}</p>}
            {locked ? (
              <div className="rounded-xl border border-dashed border-line bg-surface-2 p-8 text-center">
                <Lock size={24} className="mx-auto text-ink-muted" />
                <p className="mt-2 text-sm font-semibold text-ink">This is a premium resource</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {material.courseTitle ? `Enroll in “${material.courseTitle}” to read and download this PDF.` : 'An active course enrollment is required to open this PDF.'}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  {material.courseId && <Link to="/courses"><Button size="sm">Browse courses</Button></Link>}
                  {!user && <Link to="/login"><Button size="sm" variant="secondary">Sign in</Button></Link>}
                </div>
              </div>
            ) : (
              <iframe title={material.title} src={fileUrl} className="h-[65vh] w-full rounded-xl border border-line bg-white" />
            )}
            <p className="text-[11px] text-ink-muted">Document opens inline from the EduPulse media service. Downloading increases the material&apos;s download count.</p>
            {detail?.related.length ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">More from {material.exam}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {detail.related.slice(0, 4).map((item) => (
                    <button key={item.id} onClick={() => setOpenId(item.id)} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-left text-xs hover:border-brand">
                      <FileText size={14} className="shrink-0 text-brand" />
                      <span className="line-clamp-1 text-ink-soft">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <Alert tone="danger">This material could not be loaded.</Alert>
        )}
      </Modal>
    </div>
  );
}
