import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, BadgeCheck, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Clock3, Lock,
  PlayCircle, RotateCcw, ShieldCheck, Timer, Trophy, Users,
} from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import type { AttemptState, TestDetail } from '../lib/types';
import { Alert, Avatar, Badge, Button, EmptyState, ErrorState, LinkButton, PageLoader, SectionHeading } from '../components/ui';
import { formatDateTime, formatDuration, percent, testTypeLabel } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatarColor: string;
  score: number;
  maxMarks: number;
  percentile: number | null;
  timeTakenSeconds: number | null;
}

export function TestDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const toast = useToast();
  const [starting, setStarting] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['test-detail', id, Boolean(user)],
    queryFn: () => api.get<TestDetail>(`/tests/${id}`),
    enabled: Boolean(id),
  });

  const { data: board } = useQuery({
    queryKey: ['test-leaderboard', id],
    queryFn: () => api.get<{ test: { id: string; title: string; totalMarks: number; exam: string }; leaderboard: LeaderboardEntry[] }>(`/tests/${id}/leaderboard`),
    enabled: Boolean(id),
  });

  if (loading || isLoading) return <div className="container-x"><PageLoader label="Loading test" /></div>;
  if (error || !data) {
    return (
      <div className="container-x py-16">
        <ErrorState message={errorMessage(error) || 'This test could not be found.'} onRetry={() => refetch()} />
      </div>
    );
  }

  const { test, distribution, access, requiresEnrollment, courseSlug, attempts, inProgressAttemptId } = data;
  const isStudent = user?.role === 'student';

  const startAttempt = async () => {
    setStarting(true);
    try {
      const state = await api.post<AttemptState>(`/tests/${test.id}/attempts`);
      toast.success(state.resumed ? 'Resuming your attempt' : 'Attempt started', 'Your timer is running. Answers autosave as you go.');
      navigate(`/attempts/${state.attempt.id}`);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setStarting(false);
    }
  };

  const submitted = attempts.filter((attempt) => attempt.status !== 'in_progress');

  return (
    <div className="bg-page">
      <div className="border-b border-line bg-navy text-white">
        <div className="container-x py-9 lg:py-12">
          <Link to="/tests" className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 transition hover:text-white">
            <ArrowLeft size={13} /> All tests
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="navy" className="border-white/20 bg-white/10">{testTypeLabel(test.type)}</Badge>
            <Badge tone="navy" className="border-white/20 bg-white/10">{test.exam}</Badge>
            {requiresEnrollment && (
              <Badge tone="navy" className="border-brand/40 bg-brand/20 text-orange-200"><Lock size={10} /> Course test</Badge>
            )}
          </div>
          <h1 className="mt-3 max-w-3xl font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{test.title}</h1>
          {test.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{test.description}</p>}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5"><ClipboardList size={13} /> {test.questionCount} questions</span>
            <span className="inline-flex items-center gap-1.5"><Timer size={13} /> {test.durationMinutes} minutes</span>
            <span className="inline-flex items-center gap-1.5"><Trophy size={13} /> {test.totalMarks} marks</span>
            <span className="inline-flex items-center gap-1.5"><Users size={13} /> {test.attemptCount} attempts</span>
            <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} /> negative marking {test.negativeMarking}</span>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-6 py-8 lg:grid-cols-[1fr_360px] lg:py-10">
        <div className="space-y-6">
          {!user && (
            <Alert tone="info" title="Sign in to attempt this test">
              Scores, rank and solutions are tied to your account. <Link to={`/login?redirect=/tests/${test.id}`} className="font-semibold underline">Sign in</Link> or <Link to="/register" className="font-semibold underline">create a free account</Link>.
            </Alert>
          )}
          {user && !isStudent && (
            <Alert tone="warning" title="Tests can only be attempted from a student account">
              You are signed in as {user.role}. Student accounts can take tests, resume attempts and review solutions.
            </Alert>
          )}
          {requiresEnrollment && !access && (
            <Alert tone="warning" title="This test belongs to a paid course">
              Enroll in the course to unlock the test. Paid enrolment activates only after server-side payment verification.{' '}
              {courseSlug && <Link to={`/courses/${courseSlug}`} className="font-semibold underline">View course</Link>}
            </Alert>
          )}

          {inProgressAttemptId && (
            <div className="card flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-brand-soft/60 p-4 dark:bg-brand/10">
              <div>
                <p className="text-sm font-semibold text-ink">You have an attempt in progress</p>
                <p className="text-xs text-ink-muted">Resume before the timer expires. Your remaining time is enforced by the server.</p>
              </div>
              <LinkButton to={`/attempts/${inProgressAttemptId}`} icon={<PlayCircle size={16} />}>Resume attempt</LinkButton>
            </div>
          )}

          <section className="card p-5 sm:p-6">
            <SectionHeading eyebrow="Before you begin" title="Instructions" />
            <ol className="space-y-2.5">
              {(test.instructions.length ? test.instructions : [
                `The test contains ${test.questionCount} questions and lasts ${test.durationMinutes} minutes.`,
                `Each question carries equal or varied marks. Wrong answers attract ${test.negativeMarking} negative marking.`,
                'The timer starts when you begin and cannot be paused. The attempt submits automatically at zero.',
                'Use the question palette to navigate, mark questions for review and clear responses.',
                'Solutions are released only after the attempt is submitted.',
              ]).map((instruction, index) => (
                <li key={index} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-ink-muted">{index + 1}</span>
                  {instruction}
                </li>
              ))}
            </ol>
          </section>

          <section className="card p-5 sm:p-6">
            <SectionHeading eyebrow="Blueprint" title="Subject distribution" />
            <div className="grid gap-3 sm:grid-cols-2">
              {distribution.map((row) => (
                <div key={row.subject} className="rounded-xl border border-line bg-surface-2/60 p-3.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">{row.subject}</span>
                    <span className="text-xs text-ink-muted">{row.marks} marks</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (row.count / Math.max(1, test.questionCount)) * 100)}%` }} />
                  </div>
                  <p className="mt-1.5 text-[11px] text-ink-muted">{row.count} questions</p>
                </div>
              ))}
            </div>
          </section>

          {submitted.length > 0 && (
            <section className="card p-5 sm:p-6">
              <SectionHeading eyebrow="Your history" title="Previous attempts" />
              <div className="space-y-2">
                {submitted.map((attempt) => (
                  <div key={attempt.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3.5 py-3 text-sm">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-soft text-emerald-600 dark:bg-success/10 dark:text-emerald-300">
                      <BadgeCheck size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink">
                        {attempt.score ?? 0}/{attempt.maxMarks ?? test.totalMarks} · {percent(attempt.accuracy)} accuracy
                      </p>
                      <p className="text-[11px] text-ink-muted">
                        {formatDateTime(attempt.submittedAt)} · {attempt.timeTakenSeconds ? formatDuration(attempt.timeTakenSeconds) : '—'}
                        {attempt.rank ? ` · rank #${attempt.rank}` : ' · rank pending'}
                      </p>
                    </div>
                    {attempt.resultId ? (
                      <LinkButton to={`/results/${attempt.resultId}`} size="sm" variant="secondary" icon={<ArrowRight size={13} />}>
                        Analysis
                      </LinkButton>
                    ) : (
                      <Badge tone="neutral">{attempt.status}</Badge>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="card p-5 sm:p-6">
            <SectionHeading eyebrow="Cohort" title="Leaderboard" description="Ranks are computed from submitted results in this cohort only." />
            {!board || board.leaderboard.length === 0 ? (
              <EmptyState title="No submissions yet" description="Rank and percentile appear once candidates submit. Nothing is simulated." icon={<Trophy size={20} />} />
            ) : (
              <div className="divide-y divide-line">
                {board.leaderboard.map((entry) => (
                  <div key={`${entry.rank}-${entry.name}`} className="flex items-center gap-3 py-2.5">
                    <span className="w-7 text-sm font-bold text-ink-muted">#{entry.rank}</span>
                    <Avatar name={entry.name} color={entry.avatarColor} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{entry.name}</span>
                    <span className="text-xs font-semibold text-ink">{entry.score}/{entry.maxMarks}</span>
                    <span className="w-16 text-right text-[11px] text-ink-muted">{entry.percentile !== null ? `${entry.percentile} %ile` : '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Attempt this test</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-ink-muted">Questions</span><span className="font-semibold">{test.questionCount}</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-muted">Duration</span><span className="font-semibold">{test.durationMinutes} min</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-muted">Total marks</span><span className="font-semibold">{test.totalMarks}</span></div>
              <div className="flex items-center justify-between"><span className="text-ink-muted">Negative marking</span><span className="font-semibold">{test.negativeMarking}</span></div>
            </div>
            {test.startAt || test.endAt ? (
              <div className="mt-4 rounded-lg bg-surface-2 p-3 text-[11px] text-ink-muted">
                <p className="flex items-center gap-1.5"><CalendarDays size={12} /> Window</p>
                <p className="mt-1 text-ink-soft">{test.startAt ? formatDateTime(test.startAt) : 'Open'} — {test.endAt ? formatDateTime(test.endAt) : 'Until unpublished'}</p>
              </div>
            ) : null}
            <div className="mt-4">
              {!user ? (
                <LinkButton to={`/login?redirect=/tests/${test.id}`} className="w-full" size="lg">Sign in to start</LinkButton>
              ) : !isStudent ? (
                <Button className="w-full" size="lg" disabled>Student accounts only</Button>
              ) : !access ? (
                <LinkButton to={courseSlug ? `/courses/${courseSlug}` : '/courses'} className="w-full" size="lg" variant="secondary">Unlock with course</LinkButton>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  loading={starting}
                  onClick={startAttempt}
                  icon={inProgressAttemptId ? <RotateCcw size={16} /> : <PlayCircle size={16} />}
                >
                  {inProgressAttemptId ? 'Resume attempt' : submitted.length > 0 ? 'Retake test' : 'Start test'}
                </Button>
              )}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-muted">
              <Clock3 size={12} className="mt-0.5 shrink-0" />
              The countdown is based on the server clock. Closing the tab does not stop the timer.
            </p>
          </div>

          <div className="card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><CheckCircle2 size={15} className="text-success" /> Honest scoring</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-muted">
              <li>Answer keys stay on the server until you submit.</li>
              <li>Rank is computed among candidates who actually submitted.</li>
              <li>Percentile is withheld when you are the only attempt.</li>
              <li>Negative marking is applied exactly as declared.</li>
            </ul>
          </div>

          {test.courseTitle && courseSlug && (
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><BookOpen size={15} className="text-brand" /> Part of a course</p>
              <Link to={`/courses/${courseSlug}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-strong">
                {test.courseTitle} <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
