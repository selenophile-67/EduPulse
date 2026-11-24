import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, CheckCircle2, Clock3, MinusCircle, Target, Trophy, XCircle, BookOpen,
} from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { ResultDetail } from '../../lib/types';
import { Badge, ErrorState, LinkButton, PageLoader, Progress, SectionHeading, StatCard, Tabs } from '../../components/ui';
import { BarChart, Donut } from '../../components/charts';
import { formatDateTime, formatDuration, percent } from '../../lib/format';
import { cn } from '../../lib/cn';

type Filter = 'all' | 'correct' | 'incorrect' | 'unattempted';

export function ResultDetailPage() {
  const { resultId = '' } = useParams();
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['result-detail', resultId],
    queryFn: () => api.get<ResultDetail>(`/tests/results/${resultId}`),
    enabled: Boolean(resultId),
  });

  if (isLoading) return <PageLoader label="Loading result analysis" />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const percentScore = data.maxMarks ? Math.round((data.score / data.maxMarks) * 1000) / 10 : 0;
  const questions = data.questions.filter((question) => {
    if (filter === 'correct') return question.isCorrect;
    if (filter === 'incorrect') return question.isAttempted && !question.isCorrect;
    if (filter === 'unattempted') return !question.isAttempted;
    return true;
  });

  return (
    <div className="space-y-6">
      <Link to="/dashboard/results" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink">
        <ArrowLeft size={13} /> All results
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-navy p-6 text-white sm:p-7">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">{data.test.exam} · {data.test.type.replace('_', ' ')}</p>
            <h1 className="mt-1.5 font-display text-2xl font-extrabold tracking-tight">{data.test.title}</h1>
            <p className="mt-1 text-xs text-white/55">Submitted {formatDateTime(data.submittedAt)} · {formatDuration(data.timeTakenSeconds)} of {data.test.durationMinutes} min</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <LinkButton to={`/tests/${data.test.id}`} size="sm" variant="white">Retake test</LinkButton>
              <Link to="/dashboard/performance" className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-brand hover:text-white">
                Performance <Target size={12} />
              </Link>
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/50">Score</p>
              <p className="font-display text-4xl font-extrabold">{data.score}<span className="text-lg text-white/40">/{data.maxMarks}</span></p>
              <p className="text-[11px] text-white/55">{percentScore}%</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/50">Rank</p>
              <p className="font-display text-3xl font-extrabold">{data.rank ? `#${data.rank}` : '—'}</p>
              <p className="text-[11px] text-white/55">{data.percentile !== null ? `${data.percentile} percentile` : 'Percentile withheld'}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Correct" value={data.correctCount} icon={<CheckCircle2 size={18} />} tone="success" />
        <StatCard label="Incorrect" value={data.incorrectCount} icon={<XCircle size={18} />} />
        <StatCard label="Unattempted" value={data.unattemptedCount} icon={<MinusCircle size={18} />} tone="amber" />
        <StatCard label="Accuracy" value={percent(data.accuracy, 1)} icon={<Target size={18} />} tone="info" hint="Based on attempted questions only" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5">
          <SectionHeading eyebrow="Outcome" title="Question breakdown" />
          <Donut
            segments={[
              { label: 'Correct', value: data.correctCount, color: '#10b981' },
              { label: 'Incorrect', value: data.incorrectCount, color: '#ef4444' },
              { label: 'Unattempted', value: data.unattemptedCount, color: '#cbd5e1' },
            ]}
            centerLabel="Questions"
            centerValue={data.correctCount + data.incorrectCount + data.unattemptedCount}
          />
        </section>

        <section className="card p-5">
          <SectionHeading eyebrow="Subject analysis" title="Where the marks came from" />
          <BarChart data={data.subjectBreakdown.map((subject) => ({ label: subject.subject, value: subject.total ? Math.round((subject.correct / subject.total) * 1000) / 10 : 0 }))} />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase tracking-wide text-ink-muted">
                <tr><th className="py-1.5 pr-2">Subject</th><th className="px-2 py-1.5">Correct</th><th className="px-2 py-1.5">Wrong</th><th className="px-2 py-1.5">Skipped</th><th className="py-1.5 pl-2 text-right">Score</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.subjectBreakdown.map((subject) => (
                  <tr key={subject.subject}>
                    <td className="py-2 pr-2 font-medium text-ink">{subject.subject}</td>
                    <td className="px-2 py-2 text-emerald-600 dark:text-emerald-300">{subject.correct}</td>
                    <td className="px-2 py-2 text-red-500">{subject.incorrect}</td>
                    <td className="px-2 py-2 text-ink-muted">{subject.unattempted}</td>
                    <td className="py-2 pl-2 text-right font-semibold text-ink">{subject.score}/{subject.maxMarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card p-5">
        <SectionHeading eyebrow="Chapter-wise" title="Topic-level accuracy" />
        <div className="grid gap-3 md:grid-cols-2">
          {data.chapterBreakdown.map((chapter) => {
            const accuracy = chapter.correct + chapter.incorrect > 0 ? Math.round((chapter.correct / (chapter.correct + chapter.incorrect)) * 1000) / 10 : 0;
            return (
              <div key={chapter.chapter} className="rounded-xl border border-line p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink">{chapter.chapter}</span>
                  <span className="text-xs text-ink-muted">{chapter.score}/{chapter.maxMarks}</span>
                </div>
                <Progress value={accuracy} size="sm" tone={accuracy >= 70 ? 'success' : 'brand'} className="mt-2" />
                <p className="mt-1.5 text-[10px] text-ink-muted">{chapter.correct} correct · {chapter.incorrect} wrong · {chapter.unattempted} skipped · {accuracy}% accuracy</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeading eyebrow="Solutions" title="Question-by-question review" description="Correct answers and explanations appear only after submission." />
        <Tabs
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: 'all', label: 'All', count: data.questions.length },
            { value: 'correct', label: 'Correct', count: data.correctCount },
            { value: 'incorrect', label: 'Incorrect', count: data.incorrectCount },
            { value: 'unattempted', label: 'Skipped', count: data.unattemptedCount },
          ]}
          className="mb-4"
        />
        <div className="space-y-3">
          {questions.length === 0 ? (
            <p className="card p-8 text-center text-sm text-ink-muted">No questions in this filter.</p>
          ) : (
            questions.map((question, index) => {
              const correctOption = question.options.find((option) => option.id === question.correctAnswer);
              const selectedOption = question.options.find((option) => option.id === question.selectedOption);
              return (
                <article key={question.id} className="card p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 text-[11px] font-bold text-ink-soft">{index + 1}</span>
                    <Badge tone="neutral">{question.subject}</Badge>
                    {question.chapter && <Badge tone="neutral">{question.chapter}</Badge>}
                    <Badge tone="neutral">{question.marks} marks · -{question.negativeMarks}</Badge>
                    {!question.isAttempted ? (
                      <Badge tone="warning">Skipped</Badge>
                    ) : question.isCorrect ? (
                      <Badge tone="success"><CheckCircle2 size={10} /> Correct</Badge>
                    ) : (
                      <Badge tone="danger"><XCircle size={10} /> Incorrect</Badge>
                    )}
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{question.text}</p>

                  {question.type === 'numerical' ? (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className={cn('rounded-lg border px-3 py-2 text-xs', question.isCorrect ? 'border-success/30 bg-success-soft dark:bg-success/10' : 'border-danger/25 bg-red-50 dark:bg-red-500/10')}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Your answer</p>
                        <p className="mt-0.5 font-semibold text-ink">{question.numericAnswer || 'Not answered'}</p>
                      </div>
                      <div className="rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-xs dark:bg-success/10">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">Correct answer</p>
                        <p className="mt-0.5 font-semibold text-ink">{question.correctAnswer}{question.tolerance > 0 ? ` (±${question.tolerance})` : ''}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-1.5">
                      {question.options.map((option) => {
                        const isCorrectOption = option.id === question.correctAnswer;
                        const isSelected = option.id === question.selectedOption;
                        return (
                          <div
                            key={option.id}
                            className={cn(
                              'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
                              isCorrectOption ? 'border-success/40 bg-success-soft text-emerald-900 dark:bg-success/10 dark:text-emerald-200'
                                : isSelected ? 'border-danger/35 bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-200'
                                  : 'border-line text-ink-soft',
                            )}
                          >
                            <span className="mt-0.5 font-bold uppercase">{option.id}.</span>
                            <span className="flex-1">{option.text}</span>
                            {isSelected && <span className="text-[10px] font-semibold uppercase">Your answer</span>}
                            {isCorrectOption && <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />}
                          </div>
                        );
                      })}
                      {!question.isAttempted && (
                        <p className="text-[11px] text-ink-muted">Correct option: <span className="font-semibold text-emerald-600 dark:text-emerald-300">{correctOption?.text || question.correctAnswer}</span></p>
                      )}
                      {question.isAttempted && selectedOption && (
                        <p className="text-[11px] text-ink-muted">You selected <span className="font-semibold">{selectedOption.text}</span>.</p>
                      )}
                    </div>
                  )}

                  {question.explanation && (
                    <div className="mt-3 rounded-lg border border-line bg-surface-2/60 p-3">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-ink-muted"><BookOpen size={11} /> Explanation</p>
                      <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink-soft">{question.explanation}</p>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-[11px] text-ink-muted">
        <Clock3 size={12} /> Attempt status: <span className="font-semibold text-ink-soft">{data.attemptStatus.replace('_', ' ')}</span>
        <span>·</span>
        <Trophy size={12} /> {data.rank ? `Rank #${data.rank} of this cohort` : 'Rank appears when the cohort has submissions'}
      </div>
    </div>
  );
}
