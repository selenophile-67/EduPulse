import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlarmClock, CheckCircle2, ChevronLeft, ChevronRight, Eraser, Flag, LayoutGrid, Send } from 'lucide-react';
import { api, ApiError, errorMessage } from '../../lib/api';
import type { AttemptState } from '../../lib/types';
import { Alert, Badge, Button, ErrorState, LinkButton, Modal, PageLoader, Progress } from '../../components/ui';
import { formatClock } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useToast } from '../../context/ToastContext';

interface LocalAnswer {
  selectedOption: string | null;
  numericAnswer: string | null;
  markedForReview: boolean;
  visited: boolean;
}

const EMPTY_ANSWER: LocalAnswer = { selectedOption: null, numericAnswer: null, markedForReview: false, visited: true };

function isAnswered(answer: LocalAnswer | undefined) {
  if (!answer) return false;
  return Boolean(answer.selectedOption) || Boolean(answer.numericAnswer && answer.numericAnswer.trim());
}

export function AttemptPage() {
  const { attemptId = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const initializedRef = useRef<string | null>(null);
  const spentRef = useRef<Record<string, number>>({});
  const enteredAtRef = useRef(Date.now());
  const numericTimerRef = useRef<number | null>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => api.get<AttemptState>(`/tests/attempts/${attemptId}`),
    enabled: Boolean(attemptId),
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  const inProgress = data?.attempt.status === 'in_progress';
  const questions = data?.questions ?? [];
  const question = questions[activeIndex];

  useEffect(() => {
    if (!data) return;
    if (initializedRef.current === data.attempt.id) return;
    initializedRef.current = data.attempt.id;
    const map: Record<string, LocalAnswer> = {};
    for (const item of data.questions) {
      const saved = data.answers[item.id];
      map[item.id] = {
        selectedOption: saved?.selectedOption ?? null,
        numericAnswer: saved?.numericAnswer ?? null,
        markedForReview: Boolean(saved?.markedForReview),
        visited: Boolean(saved?.visited),
      };
      spentRef.current[item.id] = saved?.timeSpentSeconds ?? 0;
    }
    setAnswers(map);
    setActiveIndex(0);
    enteredAtRef.current = Date.now();
  }, [data]);

  const persist = useCallback(
    async (questionId: string, answer: LocalAnswer, options?: { clearResponse?: boolean }) => {
      setSaveState('saving');
      try {
        await api.patch(`/tests/attempts/${attemptId}`, {
          answers: [
            {
              questionId,
              selectedOption: options?.clearResponse ? null : answer.selectedOption,
              numericAnswer: options?.clearResponse ? '' : (answer.numericAnswer ?? ''),
              markedForReview: answer.markedForReview,
              clearResponse: options?.clearResponse,
              timeSpentSeconds: Math.round(spentRef.current[questionId] || 0),
            },
          ],
        });
        setSaveState('saved');
      } catch (cause) {
        setSaveState('error');
        if (cause instanceof ApiError && cause.status === 409) {
          toast.error('Your attempt was closed', errorMessage(cause));
          await refetch();
          return;
        }
        toast.error('Answer not saved', errorMessage(cause));
      }
    },
    [attemptId, refetch, toast],
  );

  const applyAnswer = useCallback(
    (questionId: string, patch: Partial<LocalAnswer>, save = true) => {
      const base = answersRef.current[questionId] ?? EMPTY_ANSWER;
      const next: LocalAnswer = { ...base, ...patch, visited: true };
      answersRef.current = { ...answersRef.current, [questionId]: next };
      setAnswers((current) => ({ ...current, [questionId]: next }));
      if (save) void persist(questionId, next);
      return next;
    },
    [persist],
  );

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= questions.length) return;
      const current = questions[activeIndex];
      if (current) {
        spentRef.current[current.id] = (spentRef.current[current.id] || 0) + Math.floor((Date.now() - enteredAtRef.current) / 1000);
        if (numericTimerRef.current !== null) {
          window.clearTimeout(numericTimerRef.current);
          numericTimerRef.current = null;
          const local = answersRef.current[current.id];
          if (local) void persist(current.id, local);
        }
      }
      enteredAtRef.current = Date.now();
      setActiveIndex(index);
      setPaletteOpen(false);
      const nextId = questions[index]?.id;
      if (nextId && !answersRef.current[nextId]?.visited) {
        answersRef.current = {
          ...answersRef.current,
          [nextId]: { ...(answersRef.current[nextId] ?? EMPTY_ANSWER), visited: true },
        };
        setAnswers((current) => ({ ...current, [nextId]: { ...(current[nextId] ?? EMPTY_ANSWER), visited: true } }));
      }
    },
    [activeIndex, persist, questions],
  );

  const finishAttempt = useCallback(
    async (auto = false) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      try {
        const result = await api.post<{ alreadySubmitted: boolean; resultId: string | null }>(
          `/tests/attempts/${attemptId}/submit`,
        );
        queryClient.invalidateQueries({ queryKey: ['my-attempts'] });
        queryClient.invalidateQueries({ queryKey: ['learning-overview'] });
        queryClient.invalidateQueries({ queryKey: ['performance'] });
        toast.success(auto ? 'Time is up — attempt submitted' : 'Attempt submitted', 'Your answers were scored on the server.');
        if (result.resultId) navigate(`/dashboard/results/${result.resultId}`, { replace: true });
        else navigate('/dashboard/tests', { replace: true });
      } catch (cause) {
        submittingRef.current = false;
        setSubmitting(false);
        if (cause instanceof ApiError && cause.status === 409) {
          await refetch();
          return;
        }
        toast.error('Could not submit', errorMessage(cause));
      }
    },
    [attemptId, navigate, queryClient, refetch, toast],
  );

  useEffect(() => {
    if (!data || data.attempt.status !== 'in_progress') return;
    const offset = Date.parse(data.serverNow) - Date.now();
    const deadline = Date.parse(data.attempt.expiresAt);
    const tick = () => setRemaining(Math.max(0, Math.floor((deadline - (Date.now() + offset)) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [data]);

  useEffect(() => {
    if (remaining !== 0 || !inProgress || submittingRef.current) return;
    void finishAttempt(true);
  }, [remaining, inProgress, finishAttempt]);

  useEffect(() => {
    if (!inProgress) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [inProgress]);

  useEffect(
    () => () => {
      if (numericTimerRef.current !== null) window.clearTimeout(numericTimerRef.current);
    },
    [],
  );

  const counts = useMemo(() => {
    let answered = 0;
    let answeredTotal = 0;
    let marked = 0;
    let skipped = 0;
    let visited = 0;
    for (const item of questions) {
      const answer = answers[item.id];
      const hasAnswer = isAnswered(answer);
      if (hasAnswer) {
        answeredTotal += 1;
        if (!answer?.markedForReview) answered += 1;
      } else if (answer?.visited) {
        skipped += 1;
      }
      if (answer?.visited) {
        visited += 1;
        if (answer?.markedForReview) marked += 1;
      }
    }
    return { answered, answeredTotal, marked, visited, unseen: questions.length - visited, unanswered: skipped };
  }, [answers, questions]);

  if (isLoading) return <PageLoader label="Preparing your attempt" />;
  if (error || !data) {
    return (
      <div className="container-x py-16">
        <ErrorState message={errorMessage(error) || 'This attempt could not be loaded.'} onRetry={() => refetch()} />
        <div className="mt-5 text-center"><LinkButton to="/dashboard/tests" variant="secondary">Back to my tests</LinkButton></div>
      </div>
    );
  }

  if (!inProgress) {
    return (
      <div className="container-x flex min-h-[70vh] max-w-lg flex-col items-center justify-center py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-success">
          <CheckCircle2 size={26} />
        </span>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">This attempt is already submitted</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {data.attempt.submittedAt
            ? `Submitted on ${new Date(data.attempt.submittedAt).toLocaleString()}. Scores and solutions are available under My Tests.`
            : 'The test window closed and the attempt was finalised on the server.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <LinkButton to="/dashboard/tests">Go to my tests</LinkButton>
          <LinkButton to="/tests" variant="secondary">Browse tests</LinkButton>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="container-x py-16">
        <Alert tone="warning" title="No questions in this test">
          This test has no published questions yet. Please contact the educator.
        </Alert>
        <div className="mt-4"><LinkButton to={`/tests/${data.test.id}`} variant="secondary">Back to test</LinkButton></div>
      </div>
    );
  }

  const answer = answers[question.id] ?? EMPTY_ANSWER;
  const answered = isAnswered(answer);
  const timeLow = remaining !== null && remaining <= 300;

  const paletteButtonClass = (itemId: string, index: number) => {
    const item = answers[itemId];
    const isActive = index === activeIndex;
    if (item?.markedForReview) return cn('border-amber-400 bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200', isActive && 'ring-2 ring-amber-500/60');
    if (isAnswered(item)) return cn('border-success bg-success-soft text-emerald-800 dark:bg-success/15 dark:text-emerald-300', isActive && 'ring-2 ring-success/50');
    if (item?.visited) return cn('border-red-200 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300', isActive && 'ring-2 ring-danger/40');
    return cn('border-line bg-surface-2 text-ink-muted', isActive && 'ring-2 ring-ink/30');
  };

  const palette = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        {[
          { label: 'Answered', value: counts.answered, dot: 'bg-success' },
          { label: 'Marked', value: counts.marked, dot: 'bg-amber-400' },
          { label: 'Not answered', value: counts.unanswered, dot: 'bg-red-400' },
          { label: 'Unseen', value: counts.unseen, dot: 'bg-surface-3' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2 py-1.5">
            <span className={cn('h-2 w-2 rounded-full', item.dot)} />
            <span className="text-ink-muted">{item.label}</span>
            <span className="ml-auto font-semibold text-ink">{item.value}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Questions</p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6">
          {questions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              className={cn('h-8 rounded-lg border text-[11px] font-semibold transition', paletteButtonClass(item.id, index))}
              aria-label={`Question ${index + 1}`}
              aria-current={index === activeIndex ? 'step' : undefined}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5 rounded-lg border border-line bg-surface-2 p-2.5 text-[11px] text-ink-muted">
        <p className="flex items-center justify-between"><span>Answered</span><span className="font-semibold text-ink">{counts.answeredTotal}/{questions.length}</span></p>
        <Progress value={(counts.answeredTotal / questions.length) * 100} size="sm" />
      </div>
      <Button className="w-full" onClick={() => setConfirmOpen(true)} icon={<Send size={14} />}>Submit test</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-page">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{data.test.title}</p>
            <p className="flex items-center gap-2 text-[11px] text-ink-muted">
              <Badge tone="neutral">{data.test.exam}</Badge>
              <span>{data.test.totalMarks} marks</span>
              <span className="hidden sm:inline">· {data.test.durationMinutes} min</span>
            </p>
          </div>
          <div className={cn('flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-semibold tabular-nums', timeLow ? 'border-danger/30 bg-red-50 text-danger dark:bg-red-500/10' : 'border-line bg-surface-2 text-ink')}>
            <AlarmClock size={14} /> {remaining === null ? '—' : formatClock(remaining)}
          </div>
          <Button size="sm" loading={submitting} onClick={() => setConfirmOpen(true)} icon={<Send size={13} />} className="hidden sm:inline-flex">
            Submit
          </Button>
          <Button variant="secondary" size="sm" className="sm:hidden" onClick={() => setPaletteOpen(true)} icon={<LayoutGrid size={14} />}>
            {activeIndex + 1}/{questions.length}
          </Button>
        </div>
      </header>

      <div className="container-x grid gap-6 py-6 lg:grid-cols-[1fr_300px]">
        <main className="min-w-0">
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-lg bg-navy px-2 py-1 text-[11px] font-semibold text-white">Q{activeIndex + 1}</span>
                <Badge tone="neutral">{question.subject}</Badge>
                {question.chapter && <Badge tone="neutral">{question.chapter}</Badge>}
                <Badge tone="brand">+{question.marks}</Badge>
                {question.negativeMarks > 0 && <Badge tone="danger">−{question.negativeMarks}</Badge>}
              </div>
              <span className={cn('text-[11px] font-medium', saveState === 'error' ? 'text-danger' : saveState === 'saved' ? 'text-success' : 'text-ink-muted')}>
                {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'All changes saved' : saveState === 'error' ? 'Not saved — retry by changing an answer' : ''}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-[15px] font-medium leading-relaxed text-ink">{question.text}</p>

            {question.type === 'numerical' ? (
              <div className="mt-5 max-w-xs">
                <label className="label" htmlFor="numeric-answer">Your answer</label>
                <input
                  id="numeric-answer"
                  inputMode="decimal"
                  autoComplete="off"
                  value={answer.numericAnswer ?? ''}
                  onChange={(event) => {
                    const value = event.target.value;
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: { ...(current[question.id] ?? EMPTY_ANSWER), numericAnswer: value, visited: true },
                    }));
                    if (numericTimerRef.current !== null) window.clearTimeout(numericTimerRef.current);
                    numericTimerRef.current = window.setTimeout(() => {
                      numericTimerRef.current = null;
                      const latest = answersRef.current[question.id];
                      if (latest) void persist(question.id, latest);
                    }, 900);
                  }}
                  onBlur={() => {
                    if (numericTimerRef.current !== null) {
                      window.clearTimeout(numericTimerRef.current);
                      numericTimerRef.current = null;
                    }
                    const latest = answersRef.current[question.id];
                    if (latest) void persist(question.id, latest);
                  }}
                  placeholder="Enter a number"
                  className="input h-11 w-full text-base font-semibold tabular-nums"
                />
                <p className="mt-1.5 text-[11px] text-ink-muted">Round to two decimal places unless the question says otherwise. Decimals and negatives are accepted.</p>
              </div>
            ) : (
              <div className="mt-5 space-y-2">
                {question.options.map((option, index) => {
                  const selected = answer.selectedOption === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          const base = answersRef.current[question.id] ?? EMPTY_ANSWER;
                          const cleared: LocalAnswer = { ...base, selectedOption: null, markedForReview: base.markedForReview, visited: true };
                          setAnswers((current) => ({ ...current, [question.id]: cleared }));
                          void persist(question.id, cleared, { clearResponse: true });
                        } else {
                          applyAnswer(question.id, { selectedOption: option.id });
                        }
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-sm transition',
                        selected
                          ? 'border-brand bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-200'
                          : 'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
                      )}
                    >
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold', selected ? 'border-brand bg-brand text-white' : 'border-line-strong text-ink-muted')}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{option.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => applyAnswer(question.id, { markedForReview: !answer.markedForReview })}
                icon={<Flag size={13} />}
                className={answer.markedForReview ? 'border-amber-400 text-amber-700 dark:text-amber-300' : undefined}
              >
                {answer.markedForReview ? 'Marked for review' : 'Mark for review'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<Eraser size={13} />}
                disabled={!answered && !answer.markedForReview}
                onClick={() => {
                  const base = answersRef.current[question.id] ?? EMPTY_ANSWER;
                  const cleared: LocalAnswer = { ...base, selectedOption: null, numericAnswer: '', markedForReview: base.markedForReview, visited: true };
                  setAnswers((current) => ({ ...current, [question.id]: cleared }));
                  void persist(question.id, cleared, { clearResponse: true });
                }}
              >
                Clear response
              </Button>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" disabled={activeIndex === 0} onClick={() => goTo(activeIndex - 1)} icon={<ChevronLeft size={14} />}>
                  Previous
                </Button>
                {activeIndex < questions.length - 1 ? (
                  <Button size="sm" onClick={() => goTo(activeIndex + 1)}>
                    Save &amp; next <ChevronRight size={14} />
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setConfirmOpen(true)} icon={<Send size={13} />}>Review &amp; submit</Button>
                )}
              </div>
            </div>
          </div>
        </main>

        <aside className="hidden lg:block">
          <div className="card sticky top-20 p-4">{palette}</div>
        </aside>
      </div>

      <Modal open={paletteOpen} onClose={() => setPaletteOpen(false)} title="Question palette" size="sm">
        {palette}
      </Modal>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit this test?"
        description="Once submitted, your answers are scored on the server and cannot be changed."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>Keep working</Button>
            <Button loading={submitting} onClick={() => void finishAttempt(false)} icon={<Send size={14} />}>Submit now</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg border border-line bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">Answered</p>
            <p className="mt-0.5 text-lg font-bold text-ink">{counts.answeredTotal} <span className="text-xs font-normal text-ink-muted">/ {questions.length}</span></p>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">Marked for review</p>
            <p className="mt-0.5 text-lg font-bold text-ink">{counts.marked}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">Not answered</p>
            <p className="mt-0.5 text-lg font-bold text-ink">{counts.unanswered}</p>
          </div>
          <div className="rounded-lg border border-line bg-surface-2 p-3">
            <p className="text-[11px] uppercase tracking-wide text-ink-muted">Time left</p>
            <p className={cn('mt-0.5 text-lg font-bold tabular-nums', timeLow ? 'text-danger' : 'text-ink')}>{remaining === null ? '—' : formatClock(remaining)}</p>
          </div>
        </div>
        {counts.answeredTotal === 0 && (
          <p className="mt-3 text-xs text-danger">You have not answered any questions. Submitting now will score zero.</p>
        )}
        <p className="mt-3 text-[11px] text-ink-muted">
          Need the test rules? <Link to={`/tests/${data.test.id}`} className="font-semibold text-brand-strong">Read the instructions</Link> — opening them will not pause the timer.
        </p>
      </Modal>
    </div>
  );
}
