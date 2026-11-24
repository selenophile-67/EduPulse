import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, ExternalLink, Plus } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Category, Course } from '../../lib/types';
import { Alert, Badge, Button, ErrorState, Field, Input, LinkButton, Modal, PageLoader, Select, Textarea } from '../../components/ui';
import { formatCurrency, timeAgo } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const EMPTY_FORM = {
  title: '',
  subtitle: '',
  description: '',
  category: '',
  exam: '',
  classLevel: '',
  subjectArea: '',
  language: 'English',
  level: 'Intermediate',
  durationWeeks: '12',
  price: '0',
  mrp: '0',
  validityDays: '365',
  batchTimings: '',
  targetAudience: '',
  objectives: '',
};

export function TeacherCoursesPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [search, setSearch] = useState('');
  const createOpen = params.get('create') === '1';

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => api.get<{ courses: (Course & { students: number })[] }>('/teacher/courses'),
  });
  const { data: filters } = useQuery({
    queryKey: ['course-filters'],
    queryFn: () => api.get<{ categories: Category[]; exams: { exam: string; course_count: number }[] }>('/courses/filters'),
    staleTime: 300_000,
  });

  const courses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data?.courses ?? []).filter((course) => !term || course.title.toLowerCase().includes(term) || course.exam.toLowerCase().includes(term));
  }, [data, search]);

  const closeCreate = () => {
    const next = new URLSearchParams(params);
    next.delete('create');
    setParams(next, { replace: true });
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const submit = async () => {
    setFormError('');
    setSaving(true);
    try {
      const result = await api.post<{ course: Course }>('/teacher/courses', {
        title: form.title,
        subtitle: form.subtitle,
        description: form.description,
        category: form.category,
        exam: form.exam,
        classLevel: form.classLevel,
        subjectArea: form.subjectArea,
        language: form.language || 'English',
        level: form.level,
        durationWeeks: Number(form.durationWeeks) || 12,
        priceCents: Math.round((Number(form.price) || 0) * 100),
        mrpCents: Math.round((Number(form.mrp) || 0) * 100),
        thumbnailTheme: form.category,
        validityDays: Number(form.validityDays) || 365,
        batchTimings: form.batchTimings,
        targetAudience: form.targetAudience,
        learningObjectives: form.objectives.split('\n').map((item) => item.trim()).filter(Boolean),
      });
      toast.success('Course created', 'It is saved as a draft. Add curriculum before publishing.');
      queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview'] });
      closeCreate();
      navigate(`/teacher/courses/${result.course.id}`);
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <PageLoader label="Loading your courses" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">My courses</h1>
          <p className="mt-1 text-sm text-ink-muted">Create courses, build curriculum and track enrolments. Drafts stay hidden from the public catalogue.</p>
        </div>
        <Button onClick={() => setParams({ create: '1' })} icon={<Plus size={15} />}>New course</Button>
      </div>

      {user?.profile?.approved === false && (
        <Alert tone="warning" title="Approval pending">
          An administrator must approve your educator account before you can create courses. The overview page reflects your real account state.
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your courses…" className="h-9 w-full max-w-xs text-sm" />
        <span className="text-xs text-ink-muted">{courses.length} of {data?.courses.length ?? 0} courses</span>
      </div>

      {courses.length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen size={24} className="mx-auto text-ink-muted" />
          <p className="mt-3 text-sm font-semibold text-ink">No courses yet</p>
          <p className="mt-1 text-xs text-ink-muted">Create a course to start adding subjects, chapters and lectures.</p>
          <Button className="mt-4" onClick={() => setParams({ create: '1' })} icon={<Plus size={14} />}>Create your first course</Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {courses.map((course) => (
            <div key={course.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={course.status === 'published' ? 'success' : course.status === 'draft' ? 'warning' : 'neutral'}>{course.status}</Badge>
                    <Badge tone="neutral">{course.exam}</Badge>
                    {course.isFree && <Badge tone="info">Free</Badge>}
                  </div>
                  <p className="mt-2 truncate font-semibold text-ink">{course.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">{course.subtitle || course.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-ink">{formatCurrency(course.priceCents)}</p>
                  <p className="text-[10px] text-ink-muted">updated {timeAgo(course.updatedAt)}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg border border-line bg-surface-2 p-2.5 text-center text-[11px]">
                <div><p className="font-bold text-ink">{course.students}</p><p className="text-ink-muted">students</p></div>
                <div><p className="font-bold text-ink">{course.lectureCount}</p><p className="text-ink-muted">lectures</p></div>
                <div><p className="font-bold text-ink">{course.rating.average ?? '—'}</p><p className="text-ink-muted">rating</p></div>
                <div><p className="font-bold text-ink">{course.enrolledCount}</p><p className="text-ink-muted">enrolled</p></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <LinkButton to={`/teacher/courses/${course.id}`} size="sm">Manage curriculum</LinkButton>
                {course.status === 'published' && (
                  <LinkButton to={`/courses/${course.slug}`} variant="secondary" size="sm" icon={<ExternalLink size={13} />}>Public page</LinkButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={closeCreate}
        title="Create a course"
        description="Courses start as drafts. You choose when to publish after adding lectures."
        size="lg"
        footer={<><Button variant="secondary" onClick={closeCreate}>Cancel</Button><Button onClick={submit} loading={saving}>Create draft</Button></>}
      >
        <div className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}
          <Field label="Course title" htmlFor="course-title">
            <Input id="course-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Complete JEE Main Physics — 2027" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subtitle" htmlFor="course-subtitle">
              <Input id="course-subtitle" value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} placeholder="Mechanics, optics and modern physics" />
            </Field>
            <Field label="Batch timings" htmlFor="course-batch">
              <Input id="course-batch" value={form.batchTimings} onChange={(event) => setForm({ ...form, batchTimings: event.target.value })} placeholder="Mon–Fri, 7:00 PM IST" />
            </Field>
          </div>
          <Field label="Description" hint="At least 40 characters — this appears on the public course page." htmlFor="course-description">
            <Textarea id="course-description" rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="course-category">
              <Select id="course-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="">Choose a category</option>
                {filters?.categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
              </Select>
            </Field>
            <Field label="Exam" htmlFor="course-exam">
              <Input id="course-exam" value={form.exam} onChange={(event) => setForm({ ...form, exam: event.target.value })} placeholder="JEE Main" list="teacher-exam-options" />
            </Field>
          </div>
          <datalist id="teacher-exam-options">
            {filters?.exams.map((exam) => <option key={exam.exam} value={exam.exam} />)}
          </datalist>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Level" htmlFor="course-level">
              <Select id="course-level" value={form.level} onChange={(event) => setForm({ ...form, level: event.target.value })}>
                {['Beginner', 'Intermediate', 'Advanced'].map((level) => <option key={level} value={level}>{level}</option>)}
              </Select>
            </Field>
            <Field label="Language" htmlFor="course-language">
              <Input id="course-language" value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })} />
            </Field>
            <Field label="Class level" htmlFor="course-class">
              <Input id="course-class" value={form.classLevel} onChange={(event) => setForm({ ...form, classLevel: event.target.value })} placeholder="Class 12" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (₹)" htmlFor="course-price">
              <Input id="course-price" type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
            </Field>
            <Field label="List price (₹)" hint="Used to show a discount." htmlFor="course-mrp">
              <Input id="course-mrp" type="number" min="0" value={form.mrp} onChange={(event) => setForm({ ...form, mrp: event.target.value })} />
            </Field>
            <Field label="Validity (days)" htmlFor="course-validity">
              <Input id="course-validity" type="number" min="30" max="3650" value={form.validityDays} onChange={(event) => setForm({ ...form, validityDays: event.target.value })} />
            </Field>
          </div>
          <Field label="Learning objectives" hint="One per line. These are shown on the course page." htmlFor="course-objectives">
            <Textarea id="course-objectives" rows={3} value={form.objectives} onChange={(event) => setForm({ ...form, objectives: event.target.value })} placeholder={'Master rotational dynamics\nSolve previous-year numericals'} />
          </Field>
          <Field label="Target audience" htmlFor="course-target">
            <Input id="course-target" value={form.targetAudience} onChange={(event) => setForm({ ...form, targetAudience: event.target.value })} placeholder="Class 11–12 students preparing for JEE Main" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
