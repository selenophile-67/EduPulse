import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ListChecks, Plus } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Course } from '../../lib/types';
import { Alert, Badge, Button, ErrorState, Field, Input, LinkButton, Modal, PageLoader, Select, Textarea } from '../../components/ui';
import { formatDate, testTypeLabel } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

interface TeacherTestRow {
  id: string;
  title: string;
  exam: string;
  type: string;
  status: 'draft' | 'published' | 'archived';
  courseId: string | null;
  courseTitle: string | null;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
}

const TEST_TYPES = ['full_length', 'chapter', 'subject', 'daily', 'weekly', 'previous_year', 'quiz'];

export function TeacherTestsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    description: '',
    exam: '',
    type: 'chapter',
    courseId: params.get('courseId') || '',
    durationMinutes: '60',
    negativeMarking: '0.33',
    instructions: 'The timer starts when you begin.\nEach question carries the marks shown.\nThere is no negative marking for unattempted questions.',
    startAt: '',
    endAt: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const createOpen = params.get('create') === '1';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-tests'],
    queryFn: () => api.get<{ tests: TeacherTestRow[] }>('/teacher/tests'),
  });
  const { data: courseData } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => api.get<{ courses: Course[] }>('/teacher/courses'),
  });

  const tests = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.tests ?? []).filter((test) => !term || test.title.toLowerCase().includes(term) || test.exam.toLowerCase().includes(term));
  }, [data, search]);

  const closeCreate = () => {
    const next = new URLSearchParams(params);
    next.delete('create');
    next.delete('courseId');
    setParams(next, { replace: true });
    setFormError('');
  };

  const submit = async () => {
    setFormError('');
    setSaving(true);
    try {
      const result = await api.post<{ testId: string }>('/teacher/tests', {
        title: form.title,
        description: form.description,
        exam: form.exam,
        type: form.type,
        courseId: form.courseId || null,
        durationMinutes: Number(form.durationMinutes) || 60,
        negativeMarking: Number(form.negativeMarking) || 0,
        instructions: form.instructions.split('\n').map((line) => line.trim()).filter(Boolean),
        startAt: form.startAt ? new Date(form.startAt).toISOString() : '',
        endAt: form.endAt ? new Date(form.endAt).toISOString() : '',
      });
      toast.success('Test created', 'Add questions, then publish when ready.');
      queryClient.invalidateQueries({ queryKey: ['teacher-tests'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview'] });
      closeCreate();
      navigate(`/teacher/tests/${result.testId}`);
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageLoader label="Loading your tests" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Test builder</h1>
          <p className="mt-1 text-sm text-ink-muted">Create practice tests, add questions with solutions, then publish to students.</p>
        </div>
        <Button onClick={() => setParams({ create: '1' })} icon={<Plus size={15} />}>New test</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tests…" className="h-9 w-full max-w-xs text-sm" />
        <span className="text-xs text-ink-muted">{tests.length} of {data?.tests.length ?? 0} tests</span>
      </div>

      {tests.length === 0 ? (
        <div className="card p-10 text-center">
          <ListChecks size={24} className="mx-auto text-ink-muted" />
          <p className="mt-3 text-sm font-semibold text-ink">No tests yet</p>
          <p className="mt-1 text-xs text-ink-muted">Build a chapter test or a full-length mock with real marking rules.</p>
          <Button className="mt-4" onClick={() => setParams({ create: '1' })} icon={<Plus size={14} />}>Create your first test</Button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2.5 font-semibold">Test</th>
                  <th className="px-4 py-2.5 font-semibold">Type</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Questions</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Attempts</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Created</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {tests.map((test) => (
                  <tr key={test.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <Link to={`/teacher/tests/${test.id}`} className="font-medium text-ink hover:text-brand-strong">{test.title}</Link>
                      <p className="text-[11px] text-ink-muted">{test.exam}{test.courseTitle ? ` · ${test.courseTitle}` : ' · Standalone test'}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-ink-soft">{testTypeLabel(test.type)}</td>
                    <td className="px-4 py-3"><Badge tone={test.status === 'published' ? 'success' : test.status === 'draft' ? 'warning' : 'neutral'}>{test.status}</Badge></td>
                    <td className="px-4 py-3 text-right tabular-nums">{test.questionCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{test.attemptCount}</td>
                    <td className="px-4 py-3 text-right text-[11px] text-ink-muted">{formatDate(test.createdAt)}</td>
                    <td className="px-4 py-3 text-right"><LinkButton to={`/teacher/tests/${test.id}`} variant="secondary" size="sm">Open</LinkButton></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create a test"
        description="Tests start as drafts. Publish only after adding at least one question."
        size="lg"
        footer={<><Button variant="secondary" onClick={closeCreate}>Cancel</Button><Button onClick={submit} loading={saving}>Create draft</Button></>}
      >
        <div className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}
          <Field label="Title" htmlFor="test-title"><Input id="test-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Rotational motion — chapter test" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Exam" htmlFor="test-exam"><Input id="test-exam" value={form.exam} onChange={(event) => setForm({ ...form, exam: event.target.value })} placeholder="JEE Main" /></Field>
            <Field label="Type" htmlFor="test-type">
              <Select id="test-type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                {TEST_TYPES.map((type) => <option key={type} value={type}>{testTypeLabel(type)}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Course (optional)" hint="Course tests are attemptable only by enrolled students." htmlFor="test-course">
            <Select id="test-course" value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}>
              <option value="">Standalone test (all students)</option>
              {courseData?.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </Select>
          </Field>
          <Field label="Description" htmlFor="test-description"><Textarea id="test-description" rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duration (minutes)" htmlFor="test-duration"><Input id="test-duration" type="number" min="5" max="360" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} /></Field>
            <Field label="Negative marking per wrong answer" htmlFor="test-negative"><Input id="test-negative" type="number" min="0" max="2" step="0.01" value={form.negativeMarking} onChange={(event) => setForm({ ...form, negativeMarking: event.target.value })} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Window opens (optional)" htmlFor="test-start"><Input id="test-start" type="datetime-local" value={form.startAt} onChange={(event) => setForm({ ...form, startAt: event.target.value })} /></Field>
            <Field label="Window closes (optional)" htmlFor="test-end"><Input id="test-end" type="datetime-local" value={form.endAt} onChange={(event) => setForm({ ...form, endAt: event.target.value })} /></Field>
          </div>
          <Field label="Instructions" hint="One instruction per line." htmlFor="test-instructions">
            <Textarea id="test-instructions" rows={4} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
