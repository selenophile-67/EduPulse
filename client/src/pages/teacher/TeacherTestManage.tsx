import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ListChecks, Pencil, Plus, Send, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { ManagedTest } from '../../lib/types';
import {
  Alert, Badge, Button, ErrorState, Field, Input, Modal, PageLoader, Textarea,
} from '../../components/ui';
import { testTypeLabel } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

const OPTION_IDS = ['A', 'B', 'C', 'D'];

function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function TeacherTestManagePage() {
  const { testId = '' } = useParams();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [questionOpen, setQuestionOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [questionError, setQuestionError] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    title: '',
    description: '',
    exam: '',
    durationMinutes: '60',
    negativeMarking: '0.33',
    instructions: '',
    startAt: '',
    endAt: '',
  });
  const [question, setQuestion] = useState({
    type: 'mcq' as 'mcq' | 'numerical',
    subject: '',
    chapter: '',
    text: '',
    options: OPTION_IDS.map((id) => ({ id, text: '' })),
    correctAnswer: 'A',
    numericAnswer: '',
    tolerance: '0',
    marks: '4',
    negativeMarks: '1',
    explanation: '',
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['managed-test', testId],
    queryFn: () => api.get<ManagedTest>(`/teacher/tests/${testId}`),
    enabled: Boolean(testId),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['managed-test', testId] });
    queryClient.invalidateQueries({ queryKey: ['teacher-tests'] });
    queryClient.invalidateQueries({ queryKey: ['teacher-overview'] });
  };

  const openSettings = () => {
    if (!data) return;
    setSettingsForm({
      title: data.test.title,
      description: data.test.description ?? '',
      exam: data.test.exam,
      durationMinutes: String(data.test.durationMinutes),
      negativeMarking: String(data.test.negativeMarking),
      instructions: data.test.instructions.join('\n'),
      startAt: toLocalInput(data.test.startAt),
      endAt: toLocalInput(data.test.endAt),
    });
    setSettingsOpen(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.patch(`/teacher/tests/${testId}`, {
        title: settingsForm.title,
        description: settingsForm.description,
        exam: settingsForm.exam,
        durationMinutes: Number(settingsForm.durationMinutes) || 60,
        negativeMarking: Number(settingsForm.negativeMarking) || 0,
        instructions: settingsForm.instructions.split('\n').map((line) => line.trim()).filter(Boolean),
        startAt: settingsForm.startAt ? new Date(settingsForm.startAt).toISOString() : '',
        endAt: settingsForm.endAt ? new Date(settingsForm.endAt).toISOString() : '',
      });
      toast.success('Test settings saved');
      setSettingsOpen(false);
      refresh();
    } catch (cause) {
      toast.error('Could not save settings', errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!data) return;
    const nextStatus = data.test.status === 'published' ? 'draft' : 'published';
    setStatusSaving(true);
    try {
      await api.patch(`/teacher/tests/${testId}`, { status: nextStatus });
      toast.success(nextStatus === 'published' ? 'Test published' : 'Test moved back to draft', nextStatus === 'published' ? 'Students can now attempt it.' : 'Attempts already recorded are unaffected.');
      refresh();
    } catch (cause) {
      toast.error('Could not change status', errorMessage(cause));
    } finally {
      setStatusSaving(false);
    }
  };

  const addQuestion = async () => {
    setQuestionError('');
    setSaving(true);
    try {
      const payload = question.type === 'mcq'
        ? {
            subject: question.subject,
            chapter: question.chapter,
            type: 'mcq',
            text: question.text,
            options: question.options.map((option) => ({ id: option.id, text: option.text })),
            correctAnswer: question.correctAnswer,
            tolerance: 0,
            marks: Number(question.marks) || 4,
            negativeMarks: Number(question.negativeMarks) || 0,
            explanation: question.explanation,
          }
        : {
            subject: question.subject,
            chapter: question.chapter,
            type: 'numerical',
            text: question.text,
            options: [],
            correctAnswer: question.numericAnswer,
            tolerance: Number(question.tolerance) || 0,
            marks: Number(question.marks) || 4,
            negativeMarks: Number(question.negativeMarks) || 0,
            explanation: question.explanation,
          };
      const result = await api.post<{ added: number; questionCount: number; totalMarks: number }>(`/teacher/tests/${testId}/questions`, { questions: [payload] });
      toast.success('Question added', `The test now has ${result.questionCount} questions worth ${result.totalMarks} marks.`);
      setQuestionOpen(false);
      setQuestion({
        type: 'mcq',
        subject: '',
        chapter: '',
        text: '',
        options: OPTION_IDS.map((id) => ({ id, text: '' })),
        correctAnswer: 'A',
        numericAnswer: '',
        tolerance: '0',
        marks: '4',
        negativeMarks: '1',
        explanation: '',
      });
      refresh();
    } catch (cause) {
      setQuestionError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (questionId: string, index: number) => {
    if (!window.confirm(`Delete question ${index + 1}? Marks totals will be recalculated.`)) return;
    try {
      await api.delete(`/questions/${questionId}`);
      toast.success('Question deleted');
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  if (isLoading) return <PageLoader label="Loading test builder" />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const { test, questions } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <Link to="/teacher/tests" className="inline-flex items-center gap-1 hover:text-ink"><ArrowLeft size={13} /> Test builder</Link>
        <span>/</span>
        <span className="truncate text-ink-soft">{test.title}</span>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={test.status === 'published' ? 'success' : test.status === 'draft' ? 'warning' : 'neutral'}>{test.status}</Badge>
              <Badge tone="neutral">{testTypeLabel(test.type)}</Badge>
              <Badge tone="neutral">{test.exam}</Badge>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink">{test.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {test.durationMinutes} minutes · {questions.length} questions · {test.totalMarks} marks · negative marking {test.negativeMarking}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={openSettings} icon={<Pencil size={13} />}>Settings</Button>
            <Button variant="secondary" size="sm" onClick={() => { setQuestionError(''); setQuestionOpen(true); }} icon={<Plus size={13} />}>Add question</Button>
            <Button size="sm" onClick={togglePublish} loading={statusSaving} icon={test.status === 'published' ? undefined : <Send size={13} />}>
              {test.status === 'published' ? 'Unpublish' : 'Publish'}
            </Button>
          </div>
        </div>

        {test.description && <p className="mt-3 text-sm text-ink-muted">{test.description}</p>}
        {test.status === 'draft' && questions.length === 0 && (
          <Alert tone="warning" className="mt-4" title="Add questions before publishing">
            The server refuses to publish a test without at least one question.
          </Alert>
        )}
        {test.instructions.length > 0 && (
          <details className="mt-3 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
            <summary className="cursor-pointer font-semibold text-ink-soft">Instructions shown to students</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {test.instructions.map((line, index) => <li key={index}>{line}</li>)}
            </ul>
          </details>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Questions</h2>
          <span className="text-xs text-ink-muted">{questions.length} total</span>
        </div>

        {questions.length === 0 ? (
          <div className="card p-10 text-center">
            <ListChecks size={24} className="mx-auto text-ink-muted" />
            <p className="mt-3 text-sm font-semibold text-ink">No questions yet</p>
            <p className="mt-1 text-xs text-ink-muted">Add MCQs or numerical questions with solutions.</p>
            <Button className="mt-4" size="sm" onClick={() => setQuestionOpen(true)} icon={<Plus size={13} />}>Add the first question</Button>
          </div>
        ) : (
          questions.map((item, index) => (
            <div key={item.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-navy px-1.5 py-0.5 text-[10px] font-bold text-white">Q{index + 1}</span>
                  <Badge tone="neutral">{item.subject}</Badge>
                  {item.chapter && <Badge tone="neutral">{item.chapter}</Badge>}
                  <Badge tone="brand">{item.type === 'mcq' ? 'MCQ' : 'Numerical'}</Badge>
                  <span className="text-[11px] text-ink-muted">+{item.marks} / −{item.negativeMarks}</span>
                </div>
                <button onClick={() => deleteQuestion(item.id, index)} className="rounded-md p-1.5 text-ink-muted hover:text-danger" aria-label={`Delete question ${index + 1}`}>
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{item.text}</p>
              {item.type === 'mcq' ? (
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                  {item.options.map((option) => (
                    <div key={option.id} className={`flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${option.id === item.correctAnswer ? 'border-success/40 bg-success-soft text-emerald-800 dark:bg-success/10 dark:text-emerald-300' : 'border-line text-ink-soft'}`}>
                      <span className="font-bold">{option.id}</span>
                      <span>{option.text}</span>
                      {option.id === item.correctAnswer && <CheckCircle2 size={13} className="ml-auto shrink-0 text-success" />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-ink-muted">
                  Correct answer: <span className="font-semibold text-success">{item.correctAnswer}</span>
                  {item.tolerance > 0 && ` (±${item.tolerance})`}
                </p>
              )}
              {item.explanation && (
                <p className="mt-2 rounded-lg bg-surface-2 p-2.5 text-xs leading-relaxed text-ink-muted">
                  <span className="font-semibold text-ink-soft">Solution: </span>{item.explanation}
                </p>
              )}
            </div>
          ))
        )}
      </div>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Test settings" size="lg" footer={<><Button variant="secondary" onClick={() => setSettingsOpen(false)}>Cancel</Button><Button onClick={saveSettings} loading={saving}>Save settings</Button></>}>
        <div className="space-y-4">
          <Field label="Title" htmlFor="settings-title"><Input id="settings-title" value={settingsForm.title} onChange={(event) => setSettingsForm({ ...settingsForm, title: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Exam" htmlFor="settings-exam"><Input id="settings-exam" value={settingsForm.exam} onChange={(event) => setSettingsForm({ ...settingsForm, exam: event.target.value })} /></Field>
            <Field label="Duration (minutes)" htmlFor="settings-duration"><Input id="settings-duration" type="number" min="5" max="360" value={settingsForm.durationMinutes} onChange={(event) => setSettingsForm({ ...settingsForm, durationMinutes: event.target.value })} /></Field>
            <Field label="Negative marking" htmlFor="settings-negative"><Input id="settings-negative" type="number" min="0" max="2" step="0.01" value={settingsForm.negativeMarking} onChange={(event) => setSettingsForm({ ...settingsForm, negativeMarking: event.target.value })} /></Field>
          </div>
          <Field label="Description" htmlFor="settings-description"><Textarea id="settings-description" rows={2} value={settingsForm.description} onChange={(event) => setSettingsForm({ ...settingsForm, description: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Window opens" htmlFor="settings-start"><Input id="settings-start" type="datetime-local" value={settingsForm.startAt} onChange={(event) => setSettingsForm({ ...settingsForm, startAt: event.target.value })} /></Field>
            <Field label="Window closes" htmlFor="settings-end"><Input id="settings-end" type="datetime-local" value={settingsForm.endAt} onChange={(event) => setSettingsForm({ ...settingsForm, endAt: event.target.value })} /></Field>
          </div>
          <Field label="Instructions" hint="One per line." htmlFor="settings-instructions">
            <Textarea id="settings-instructions" rows={4} value={settingsForm.instructions} onChange={(event) => setSettingsForm({ ...settingsForm, instructions: event.target.value })} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={questionOpen}
        onClose={() => setQuestionOpen(false)}
        title="Add a question"
        description="Marking is applied server-side when a student submits."
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setQuestionOpen(false)}>Cancel</Button><Button onClick={addQuestion} loading={saving}>Add question</Button></>}
      >
        <div className="space-y-4">
          {questionError && <Alert tone="danger">{questionError}</Alert>}
          <div className="flex gap-1.5">
            {(['mcq', 'numerical'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setQuestion({ ...question, type })}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${question.type === type ? 'border-brand bg-brand-soft text-brand-strong dark:bg-brand/10' : 'border-line text-ink-muted hover:text-ink'}`}
              >
                {type === 'mcq' ? 'Multiple choice' : 'Numerical'}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subject" htmlFor="question-subject"><Input id="question-subject" value={question.subject} onChange={(event) => setQuestion({ ...question, subject: event.target.value })} placeholder="Physics" /></Field>
            <Field label="Chapter" htmlFor="question-chapter"><Input id="question-chapter" value={question.chapter} onChange={(event) => setQuestion({ ...question, chapter: event.target.value })} placeholder="Rotational motion" /></Field>
          </div>
          <Field label="Question" htmlFor="question-text"><Textarea id="question-text" rows={3} value={question.text} onChange={(event) => setQuestion({ ...question, text: event.target.value })} /></Field>
          {question.type === 'mcq' ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink-soft">Options (select the correct one)</p>
              {question.options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuestion({ ...question, correctAnswer: option.id })}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${question.correctAnswer === option.id ? 'border-success bg-success text-white' : 'border-line-strong text-ink-muted'}`}
                    aria-label={`Mark option ${option.id} correct`}
                  >
                    {option.id}
                  </button>
                  <Input
                    value={option.text}
                    onChange={(event) => {
                      const options = question.options.map((item, position) => (position === index ? { ...item, text: event.target.value } : item));
                      setQuestion({ ...question, options });
                    }}
                    placeholder={`Option ${option.id}`}
                    className="h-9 text-sm"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Correct numeric answer" htmlFor="question-answer"><Input id="question-answer" value={question.numericAnswer} onChange={(event) => setQuestion({ ...question, numericAnswer: event.target.value })} placeholder="9.8" /></Field>
              <Field label="Accepted tolerance" hint="Absolute difference allowed when grading." htmlFor="question-tolerance"><Input id="question-tolerance" type="number" min="0" step="0.01" value={question.tolerance} onChange={(event) => setQuestion({ ...question, tolerance: event.target.value })} /></Field>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marks for correct" htmlFor="question-marks"><Input id="question-marks" type="number" min="1" max="20" value={question.marks} onChange={(event) => setQuestion({ ...question, marks: event.target.value })} /></Field>
            <Field label="Penalty for wrong" htmlFor="question-negative"><Input id="question-negative" type="number" min="0" max="10" step="0.25" value={question.negativeMarks} onChange={(event) => setQuestion({ ...question, negativeMarks: event.target.value })} /></Field>
          </div>
          <Field label="Explanation" hint="Shown in the solution view after submission." htmlFor="question-explanation"><Textarea id="question-explanation" rows={3} value={question.explanation} onChange={(event) => setQuestion({ ...question, explanation: event.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}
