import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Course } from '../../lib/types';
import { Alert, Badge, Button, ErrorState, Field, Input, LinkButton, Modal, PageLoader, Select, Textarea } from '../../components/ui';
import { timeAgo } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

interface TeacherMaterialRow {
  id: string;
  title: string;
  exam: string;
  category: string;
  subject: string | null;
  isPremium: boolean;
  courseId: string;
  courseTitle: string;
  downloadCount: number;
  createdAt: string;
}

export function TeacherMaterialsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pdf, setPdf] = useState<File | null>(null);
  const [form, setForm] = useState({ courseId: '', title: '', description: '', category: 'Notes', subject: '', chapterName: '', isPremium: false });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-materials'],
    queryFn: () => api.get<{ materials: TeacherMaterialRow[] }>('/teacher/materials'),
  });
  const { data: courseData } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => api.get<{ courses: Course[] }>('/teacher/courses'),
  });

  const selectedCourse = useMemo(() => courseData?.courses.find((course) => course.id === form.courseId), [courseData, form.courseId]);

  const submit = async () => {
    setFormError('');
    if (!form.courseId) {
      setFormError('Choose the course this material belongs to.');
      return;
    }
    if (!pdf) {
      setFormError('Choose a PDF file to upload.');
      return;
    }
    setSaving(true);
    try {
      const upload = new FormData();
      upload.append('pdf', pdf);
      const uploaded = await api.upload<{ upload: { key: string } }>('/teacher/uploads/pdf', upload);
      await api.post('/teacher/materials', {
        title: form.title,
        description: form.description,
        exam: selectedCourse?.exam || 'General',
        category: form.category,
        subject: form.subject,
        chapterName: form.chapterName,
        isPremium: form.isPremium,
        courseId: form.courseId,
        fileKey: uploaded.upload.key,
      });
      toast.success('Material uploaded', 'Students can now preview or download it from the course.');
      setOpen(false);
      setPdf(null);
      setForm({ courseId: '', title: '', description: '', category: 'Notes', subject: '', chapterName: '', isPremium: false });
      queryClient.invalidateQueries({ queryKey: ['teacher-materials'] });
      queryClient.invalidateQueries({ queryKey: ['managed-course'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (material: TeacherMaterialRow) => {
    if (!window.confirm(`Delete “${material.title}”? Students will lose access immediately.`)) return;
    try {
      await api.delete(`/teacher/materials/${material.id}`);
      toast.success('Material removed');
      queryClient.invalidateQueries({ queryKey: ['teacher-materials'] });
      queryClient.invalidateQueries({ queryKey: ['managed-course'] });
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  if (isLoading) return <PageLoader label="Loading materials" />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Study materials</h1>
          <p className="mt-1 text-sm text-ink-muted">PDFs attached to your courses. Premium files require an active enrolment.</p>
        </div>
        <Button onClick={() => { setFormError(''); setOpen(true); }} icon={<Plus size={15} />}>Upload PDF</Button>
      </div>

      {!data?.materials.length ? (
        <div className="card p-10 text-center">
          <FileText size={24} className="mx-auto text-ink-muted" />
          <p className="mt-3 text-sm font-semibold text-ink">No materials yet</p>
          <p className="mt-1 text-xs text-ink-muted">Upload notes, formula sheets and previous-year papers to your courses.</p>
          <Button className="mt-4" size="sm" onClick={() => setOpen(true)} icon={<Plus size={13} />}>Upload your first PDF</Button>
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {data.materials.map((material) => (
            <div key={material.id} className="flex flex-wrap items-center gap-3 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-muted">
                <FileText size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{material.title}</p>
                <p className="truncate text-[11px] text-ink-muted">
                  {material.courseTitle} · {material.category}{material.subject ? ` · ${material.subject}` : ''} · {material.downloadCount} downloads · {timeAgo(material.createdAt)}
                </p>
              </div>
              {material.isPremium && <Badge tone="brand">Premium</Badge>}
              <LinkButton to={`/api/media/material/${material.id}`} variant="secondary" size="sm">Preview</LinkButton>
              <button onClick={() => remove(material)} className="rounded-md p-1.5 text-ink-muted hover:text-danger" aria-label={`Delete ${material.title}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Upload study material" size="lg" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={submit} loading={saving}>Upload PDF</Button></>}>
        <div className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}
          <Field label="Course" htmlFor="material-course">
            <Select id="material-course" value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}>
              <option value="">Choose a course</option>
              {courseData?.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </Select>
          </Field>
          <Field label="Title" htmlFor="tm-title"><Input id="tm-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Rotational motion — formula sheet" /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category" htmlFor="tm-category">
              <Select id="tm-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                {['Notes', 'Formula Sheet', 'Previous Papers', 'Practice Set', 'Solution'].map((category) => <option key={category} value={category}>{category}</option>)}
              </Select>
            </Field>
            <Field label="Subject" htmlFor="tm-subject"><Input id="tm-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field>
            <Field label="Chapter" htmlFor="tm-chapter"><Input id="tm-chapter" value={form.chapterName} onChange={(event) => setForm({ ...form, chapterName: event.target.value })} /></Field>
          </div>
          <Field label="Description" htmlFor="tm-description"><Textarea id="tm-description" rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
          <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <input type="checkbox" checked={form.isPremium} onChange={(event) => setForm({ ...form, isPremium: event.target.checked })} className="h-4 w-4 rounded border-line accent-brand" />
            Premium — restrict to enrolled students
          </label>
          <Field label="PDF file" hint="Maximum 30 MB." htmlFor="tm-pdf">
            <input id="tm-pdf" type="file" accept="application/pdf" onChange={(event) => setPdf(event.target.files?.[0] ?? null)} className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft hover:file:bg-surface-3" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
