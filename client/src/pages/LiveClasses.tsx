import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, CalendarDays, Clock3, Info, Loader2, Radio, UserRound, Users, Video, VideoOff,
} from 'lucide-react';
import { api, ApiError, errorMessage, queryString } from '../lib/api';
import type { LiveClass, Paginated } from '../lib/types';
import { Alert, Avatar, Badge, Button, Card, EmptyState, ErrorState, PageLoader, Tabs } from '../components/ui';
import { countdown, formatDate, formatTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/cn';

interface LiveClassItem extends LiveClass {
  canJoin: boolean;
  streamingConfigured: boolean;
}

interface LiveList extends Paginated<LiveClassItem> {
  streaming: { configured: boolean; provider: string };
}

interface JoinResult {
  provider: 'livekit' | 'external';
  token?: string;
  url?: string;
  room?: string;
  joinUrl?: string;
}

const TABS = [
  { value: 'live', label: 'Live now' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Replays' },
  { value: '', label: 'All sessions' },
] as const;

export function LiveClassesPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') ?? 'upcoming';
  const page = Number(params.get('page') || 1);
  const { user } = useAuth();
  const toast = useToast();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  const { data: integration } = useQuery({
    queryKey: ['live-status'],
    queryFn: () => api.get<{ streaming: { configured: boolean; provider: string }; note: string }>('/live-classes/status'),
    staleTime: 120_000,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['live-classes', status, page, Boolean(user)],
    queryFn: () => api.get<LiveList>(`/live-classes${queryString({ status, page, limit: 12 })}`),
  });

  const setStatus = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set('status', value);
    else next.delete('status');
    next.delete('page');
    setParams(next, { replace: true });
  };

  const join = async (session: LiveClassItem) => {
    if (!user) return;
    setJoiningId(session.id);
    setNotice(null);
    try {
      const result = await api.post<JoinResult>(`/live-classes/${session.id}/join`);
      if (result.provider === 'external' && result.joinUrl) {
        window.open(result.joinUrl, '_blank', 'noopener,noreferrer');
        toast.success('Opening the meeting link', 'The class is hosted on your educator’s meeting platform.');
      } else if (result.token && result.url && result.room) {
        const base = result.url.replace(/\/+$/, '');
        window.open(`${base}/meet/${encodeURIComponent(result.room)}?access_token=${encodeURIComponent(result.token)}`, '_blank', 'noopener,noreferrer');
        toast.success('Joining the live room', 'Your attendance is recorded server-side.');
      } else {
        setNotice({ title: 'Unexpected join response', message: 'The server did not return a streaming token. Please try again or contact support.' });
      }
      refetch();
    } catch (cause) {
      const notConfigured = cause instanceof ApiError && cause.status === 503;
      setNotice({
        title: notConfigured ? 'In-app streaming is not configured' : 'Could not join this class',
        message: errorMessage(cause),
      });
    } finally {
      setJoiningId(null);
    }
  };

  const sessions = data?.items || [];

  return (
    <div className="bg-page">
      <section className="relative overflow-hidden border-b border-line bg-navy text-white">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="container-x relative py-12 lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80">
            <Radio size={12} /> Live &amp; scheduled classes
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Doubt-clearing sessions with your educators.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
            Every session here is on the real schedule. Live badges reflect the current server time, attendance is recorded, and replays appear only when the educator publishes a recording.
          </p>
        </div>
      </section>

      <div className="container-x py-8 lg:py-10">
        {integration && !integration.streaming.configured && (
          <Alert tone="warning" title="In-app video streaming is not configured on this deployment" className="mb-5">
            {integration.note} Sessions still appear with accurate schedules and attendance tracking. Join buttons will return a clear “not configured” message instead of pretending to stream.
          </Alert>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={status as (typeof TABS)[number]['value']} onChange={setStatus} tabs={TABS.map((tab) => ({ ...tab }))} />
          {data && <p className="text-xs text-ink-muted">{data.total} {data.total === 1 ? 'session' : 'sessions'}</p>}
        </div>

        {notice && (
          <Alert tone={notice.title.includes('not configured') ? 'warning' : 'danger'} title={notice.title} className="mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{notice.message}</span>
              <Button size="sm" variant="secondary" onClick={() => setNotice(null)}>Dismiss</Button>
            </div>
          </Alert>
        )}

        {isLoading ? (
          <PageLoader label="Loading live classes" />
        ) : error ? (
          <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<VideoOff size={22} />}
            title={status === 'live' ? 'No classes are live right now' : 'No sessions in this tab yet'}
            description="Check the upcoming tab for the next scheduled class. Live labels only appear when a session is genuinely in progress."
            action={<Link to="/courses" className="text-sm font-semibold text-brand-strong">Browse courses <ArrowRight size={13} className="inline" /></Link>}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => {
              const isLive = session.status === 'live';
              return (
                <Card key={session.id} className={cn('flex flex-col p-5', isLive && 'border-success/30')}>
                  <div className="flex items-start justify-between gap-2">
                    {isLive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
                        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" /> LIVE NOW
                      </span>
                    ) : session.status === 'completed' ? (
                      <Badge tone="neutral">Completed</Badge>
                    ) : session.status === 'cancelled' ? (
                      <Badge tone="danger">Cancelled</Badge>
                    ) : (
                      <Badge tone="info"><CalendarDays size={10} /> {countdown(session.scheduledStart)}</Badge>
                    )}
                    {session.attendeeCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted"><Users size={11} />{session.attendeeCount} joined</span>
                    )}
                  </div>

                  <h2 className="mt-3 line-clamp-2 text-base font-semibold leading-snug text-ink">{session.title}</h2>
                  <p className="mt-1 truncate text-xs text-ink-muted">{session.courseTitle || 'Open session'}</p>
                  {session.description && <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">{session.description}</p>}

                  <div className="mt-3 flex items-center gap-2">
                    <Avatar name={session.teacher.name} color={session.teacher.avatarColor} size={24} />
                    <span className="truncate text-xs font-medium text-ink-soft">{session.teacher.name}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-ink-muted">
                    <Clock3 size={12} /> {formatDate(session.scheduledStart)} · {formatTime(session.scheduledStart)} – {formatTime(session.scheduledEnd)}
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-4">
                    {isLive ? (
                      user ? (
                        user.role !== 'student' ? (
                          <Button size="sm" className="flex-1" disabled>Student accounts join here</Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => join(session)}
                            icon={joiningId === session.id ? <Loader2 size={13} className="animate-spin" /> : <Video size={13} />}
                            disabled={joiningId === session.id}
                          >
                            Join class
                          </Button>
                        )
                      ) : (
                        <Link to={`/login?redirect=/live-classes`} className="flex-1">
                          <Button size="sm" className="w-full" icon={<UserRound size={13} />}>Sign in to join</Button>
                        </Link>
                      )
                    ) : session.status === 'completed' && session.recordingUrl ? (
                      <a href={session.recordingUrl} target="_blank" rel="noreferrer" className="flex-1">
                        <Button size="sm" variant="secondary" className="w-full" icon={<Video size={13} />}>Watch replay</Button>
                      </a>
                    ) : session.status === 'completed' ? (
                      <div className="flex-1">
                        <Button size="sm" variant="secondary" className="w-full" disabled>Replay not published</Button>
                      </div>
                    ) : (
                      <div className="flex-1 rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-center text-[11px] text-ink-muted">
                        Join opens when the class goes live
                      </div>
                    )}
                    {session.courseId && (
                      <Link to="/courses" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink-muted transition hover:border-brand hover:text-brand-strong" aria-label="Browse course">
                        <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => {
              const next = new URLSearchParams(params);
              next.set('page', String(page - 1));
              setParams(next);
            }}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => {
              const next = new URLSearchParams(params);
              next.set('page', String(page + 1));
              setParams(next);
            }}>Next</Button>
          </div>
        )}

        <Card className="mt-8 flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-info dark:bg-blue-500/10">
            <Info size={18} />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">How live classes work here</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">
              Schedules and status come from the database and server clock. When LiveKit credentials are configured, students receive signed room tokens. Otherwise, an educator can attach an external meeting link. Nothing is simulated.
            </p>
          </div>
          <Link to="/contact" className="text-xs font-semibold text-brand-strong">Need help?</Link>
        </Card>
      </div>
    </div>
  );
}
