import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Bookmark, BookOpen, FileText, PlayCircle, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { BookmarkItem } from '../../lib/types';
import { Badge, Button, EmptyState, ErrorState, LinkButton, PageLoader, SectionHeading } from '../../components/ui';
import { timeAgo } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

const ICONS = {
  lecture: PlayCircle,
  material: FileText,
  test: BookOpen,
  course: BookOpen,
} as const;

const LABELS = {
  lecture: 'Lecture',
  material: 'Material',
  test: 'Test',
  course: 'Course',
} as const;

export function BookmarksPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [removing, setRemoving] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get<{ bookmarks: BookmarkItem[] }>('/bookmarks'),
  });

  const remove = async (bookmark: BookmarkItem) => {
    setRemoving(bookmark.id);
    try {
      await api.post('/bookmarks', { entityType: bookmark.entityType, entityId: bookmark.entityId });
      toast.success('Bookmark removed');
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setRemoving(null);
    }
  };

  const bookmarks = data?.bookmarks || [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading eyebrow="Saved" title="Bookmarks" description="Lectures, materials, tests and courses you saved for later." className="mb-0" />
        <LinkButton to="/materials" variant="secondary" icon={<FileText size={14} />}>Study library</LinkButton>
      </div>

      {isLoading ? (
        <PageLoader label="Loading bookmarks" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : bookmarks.length === 0 ? (
        <EmptyState
          icon={<Bookmark size={22} />}
          title="Nothing bookmarked yet"
          description="Use the bookmark action on a lecture, material, test or course to keep it here."
          action={<LinkButton to="/materials">Browse study materials</LinkButton>}
        />
      ) : (
        <div className="card divide-y divide-line overflow-hidden">
          {bookmarks.map((bookmark) => {
            const Icon = ICONS[bookmark.entityType] || BookOpen;
            return (
              <div key={bookmark.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300">
                  <Icon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={bookmark.link} className="truncate text-sm font-semibold text-ink hover:text-brand-strong">{bookmark.title}</Link>
                    <Badge tone="neutral">{LABELS[bookmark.entityType]}</Badge>
                  </div>
                  <p className="truncate text-[11px] text-ink-muted">{bookmark.subtitle} · saved {timeAgo(bookmark.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={bookmark.link} className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft hover:border-brand hover:text-brand-strong">
                    Open <ArrowRight size={11} />
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(bookmark)}
                    loading={removing === bookmark.id}
                    aria-label={`Remove bookmark for ${bookmark.title}`}
                  >
                    <Trash2 size={15} className="text-ink-muted" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-ink-muted">Bookmarks are stored on your account and are removed from here when you unbookmark an item.</p>
    </div>
  );
}
