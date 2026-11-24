import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, CheckCircle2, ChevronLeft, ChevronRight, Clock3, FileText,
  GraduationCap, ListVideo, Lock, PlayCircle, Sparkles,
} from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { LectureDetail } from '../../lib/types';
import { Alert, Badge, Button, ErrorState, LinkButton, PageLoader, Progress } from '../../components/ui';
import { formatDuration } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useToast } from '../../context/ToastContext';

export function LecturePlayerPage() {
  const { lectureId = '' } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);
  const [completed, setCompleted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [marking, setMarking] = useState(false);
  const [resumeHint, setResumeHint] = useState<number | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['lecture', lectureId],
    queryFn: () => api.get<LectureDetail>(`/learning/lectures/${lectureId}`),
    enabled: Boolean(lectureId),
  });

  useEffect(() => {
    if (!data) return;
    setCompleted(Boolean(data.progress.completed));
    setBookmarked(data.bookmarked);
    setResumeHint(data.progress.positionSeconds > 5 ? data.progress.positionSeconds : null);
    lastSavedRef.current = 0;
  }, [data?.lecture.id, data]);

  const lecture = data?.lecture;

  const persist = useCallback(async () => {
    if (!lecture || !videoRef.current || !lecture.hasAccess) return;
    const video = videoRef.current;
    const position = Math.floor(video.currentTime);
    if (position < 3) return;
    try {
      await api.put(`/learning/lectures/${lecture.id}/progress`, {
        positionSeconds: position,
        durationSeconds: Math.floor(video.duration || lecture.durationSeconds),
      });
      lastSavedRef.current = position;
    } catch {
      // Progress autosave is best-effort; explicit completion surfaces errors.
    }
  }, [lecture]);

  useEffect(() => {
    if (!lecture?.hasAccess) return;
    const timer = window.setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) return;
      if (Math.abs(video.currentTime - lastSavedRef.current) < 10) return;
      void persist();
    }, 15_000);
    return () => window.clearInterval(timer);
  }, [lecture?.id, lecture?.hasAccess, persist]);

  const markComplete = async () => {
    if (!lecture) return;
    setMarking(true);
    try {
      const result = await api.post<{ courseProgressPercent: number }>(`/learning/lectures/${lecture.id}/complete`);
      setCompleted(true);
      toast.success('Lecture completed', `Course progress is now ${result.courseProgressPercent}%.`);
      queryClient.invalidateQueries({ queryKey: ['my-course'] });
      queryClient.invalidateQueries({ queryKey: ['learning-overview'] });
      queryClient.invalidateQueries({ queryKey: ['lecture', lecture.id] });
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setMarking(false);
    }
  };

  const toggleBookmark = async () => {
    if (!lecture) return;
    try {
      const result = await api.post<{ bookmarked: boolean }>('/bookmarks', { entityType: 'lecture', entityId: lecture.id });
      setBookmarked(result.bookmarked);
      toast.success(result.bookmarked ? 'Lecture bookmarked' : 'Bookmark removed');
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  if (isLoading) return <div className="container-x"><PageLoader label="Loading lecture" /></div>;
  if (error || !data || !lecture) {
    return (
      <div className="container-x py-16">
        <ErrorState message={errorMessage(error) || 'This lecture could not be loaded.'} onRetry={() => refetch()} />
        <div className="mt-5 text-center">
          <LinkButton to="/dashboard/learning" variant="secondary">Back to My Learning</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-xl">
        <div className="container-x flex h-14 items-center gap-3">
          <Link to={`/dashboard/learning/${data.course.id}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink">
            <ArrowLeft size={14} /> Back to course
          </Link>
          <span className="hidden truncate text-xs text-ink-muted sm:block">/ {data.course.title}</span>
          <div className="ml-auto flex items-center gap-1.5">
            {data.navigation.previousId && (
              <Link to={`/dashboard/lectures/${data.navigation.previousId}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:border-brand hover:text-brand-strong" aria-label="Previous lecture">
                <ChevronLeft size={15} />
              </Link>
            )}
            {data.navigation.nextId && (
              <Link to={`/dashboard/lectures/${data.navigation.nextId}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-muted hover:border-brand hover:text-brand-strong" aria-label="Next lecture">
                <ChevronRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container-x grid gap-6 py-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-line bg-black">
            <video
              key={lecture.id}
              ref={videoRef}
              src={lecture.streamUrl}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-black"
              onLoadedMetadata={(event) => {
                if (resumeHint && resumeHint > 5 && resumeHint < event.currentTarget.duration - 5) {
                  event.currentTarget.currentTime = resumeHint;
                }
              }}
              onPlay={() => setResumeHint(null)}
              onPause={() => void persist()}
              onEnded={() => {
                if (lecture.hasAccess && !completed) void markComplete();
              }}
              onError={() => toast.error('Video unavailable', 'The educator may not have uploaded this lecture file yet.')}
            />
          </div>

          {resumeHint && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-info/25 bg-blue-50 px-4 py-2.5 text-xs text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
              <span>Resuming from {formatDuration(resumeHint)} of your saved progress.</span>
              <button
                type="button"
                onClick={() => { if (videoRef.current) videoRef.current.currentTime = 0; setResumeHint(null); }}
                className="font-semibold underline"
              >
                Start from beginning
              </button>
            </div>
          )}

          {!lecture.hasAccess && (
            <Alert tone="warning" title="Preview lecture">
              You are watching a preview. Enrol in the course to unlock every lecture, save progress and receive completion credit.
            </Alert>
          )}

          <div className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  {lecture.subjectName && <Badge tone="neutral">{lecture.subjectName}</Badge>}
                  {lecture.chapterName && <Badge tone="neutral">{lecture.chapterName}</Badge>}
                  {completed && <Badge tone="success"><CheckCircle2 size={10} /> Completed</Badge>}
                </div>
                <h1 className="mt-2 font-display text-xl font-bold leading-snug text-ink sm:text-2xl">{lecture.title}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
                  <span className="inline-flex items-center gap-1"><Clock3 size={12} /> {formatDuration(lecture.durationSeconds)}</span>
                  <span className="inline-flex items-center gap-1"><ListVideo size={12} /> Lecture {data.navigation.current} of {data.navigation.total}</span>
                  <span className="inline-flex items-center gap-1"><GraduationCap size={12} /> {data.course.teacherName}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={toggleBookmark} icon={bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}>
                  {bookmarked ? 'Saved' : 'Save'}
                </Button>
                {lecture.hasAccess && (
                  <Button size="sm" onClick={markComplete} loading={marking} disabled={completed} icon={<CheckCircle2 size={14} />}>
                    {completed ? 'Completed' : 'Mark complete'}
                  </Button>
                )}
              </div>
            </div>
            {lecture.description && <p className="mt-3 text-sm leading-relaxed text-ink-muted">{lecture.description}</p>}
            {lecture.hasAccess && (
              <div className="mt-4 max-w-md">
                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>Course progress</span>
                  <span className="font-semibold text-ink">{data.navigation.completedPercent}%</span>
                </div>
                <Progress value={data.navigation.completedPercent} size="sm" tone="success" className="mt-1.5" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {data.navigation.previousId ? (
              <LinkButton to={`/dashboard/lectures/${data.navigation.previousId}`} variant="outline" size="sm"><ChevronLeft size={14} /> Previous</LinkButton>
            ) : (
              <Button variant="outline" size="sm" disabled icon={<ChevronLeft size={14} />}>Previous</Button>
            )}
            {data.navigation.nextId ? (
              <LinkButton to={`/dashboard/lectures/${data.navigation.nextId}`} size="sm">Next lecture <ChevronRight size={14} /></LinkButton>
            ) : (
              <LinkButton to={`/dashboard/learning/${data.course.id}`} size="sm"><CheckCircle2 size={14} /> Back to course</LinkButton>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><ListVideo size={15} className="text-brand" /> Course lectures</p>
            <div className="mt-3 max-h-[440px] space-y-0.5 overflow-y-auto pr-1">
              {data.siblings.map((sibling, index) => (
                <Link
                  key={sibling.id}
                  to={`/dashboard/lectures/${sibling.id}`}
                  className={cn(
                    'flex items-start gap-2.5 rounded-lg px-2 py-2 text-xs transition',
                    sibling.id === lecture.id ? 'bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300' : 'text-ink-soft hover:bg-surface-2',
                  )}
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold">
                    {sibling.completed ? <CheckCircle2 size={13} className="text-success" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{sibling.title}</span>
                    <span className="block text-[10px] text-ink-muted">
                      {formatDuration(sibling.duration)}{sibling.isPreview ? ' · preview' : ''}{sibling.id === lecture.id ? ' · now playing' : ''}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {data.materials.length > 0 && (
            <div className="card p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><FileText size={15} className="text-brand" /> Course materials</p>
              <div className="mt-2.5 space-y-1">
                {data.materials.map((material) => (
                  <Link key={material.id} to={`/materials?highlight=${material.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-ink-soft hover:bg-surface-2">
                    {material.isPremium ? <Lock size={12} className="shrink-0 text-ink-muted" /> : <FileText size={12} className="shrink-0 text-ink-muted" />}
                    <span className="truncate">{material.title}</span>
                    <ArrowRight size={11} className="ml-auto shrink-0 text-ink-muted" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="card p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Sparkles size={15} className="text-amber-500" /> Study tip</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
              Watch the lecture, then immediately attempt the chapter test. Retrieval right after learning is what makes recall stick.
            </p>
            <Link to="/tests" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-strong">
              <PlayCircle size={12} /> Practice now
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
