import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Pencil, Search, Trash2 } from 'lucide-react';
import { api, errorMessage, queryString } from '../../lib/api';
import type { Course, Paginated } from '../../lib/types';
import { Avatar, Badge, Button, ErrorState, Field, Input, LinkButton, Modal, PageLoader, Pagination, Select } from '../../components/ui';
import { formatCurrency, formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

export function AdminCoursesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({ status: 'draft', price: '0', mrp: '0', teacherId: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(q); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [q]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-courses', { page, query, status }],
    queryFn: () => api.get<Paginated<Course>>(`/admin/courses${queryString({ page, limit: 20, q: query, status })}`),
  });
  const { data: teachers } = useQuery({
    queryKey: ['admin-teacher-list'],
    queryFn: () => api.get<Paginated<{ id: string; name: string; email: string }>>('/admin/users?role=teacher&limit=100'),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
  };

  const openEdit = (course: Course) => {
    setEditing(course);
    setForm({
      status: course.status,
      price: String(course.priceCents / 100),
      mrp: String(course.mrpCents / 100),
      teacherId: course.teacher.id,
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.patch(`/admin/courses/${editing.id}`, {
        status: form.status,
        priceCents: Math.round((Number(form.price) || 0) * 100),
        mrpCents: Math.round((Number(form.mrp) || 0) * 100),
        teacherId: form.teacherId || undefined,
      });
      toast.success('Course updated', form.status === 'published' ? 'It is now visible in the public catalogue.' : 'Changes saved.');
      setEditing(null);
      invalidate();
    } catch (cause) {
      toast.error('Could not update course', errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (course: Course) => {
    if (!window.confirm(`Archive and remove “${course.title}”? Existing enrolments keep their access history but the course disappears from the catalogue.`)) return;
    try {
      await api.delete(`/admin/courses/${course.id}`);
      toast.success('Course archived');
      invalidate();
    } catch (cause) {
      toast.error('Could not archive course', errorMessage(cause));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Courses</h1>
        <p className="mt-1 text-sm text-ink-muted">Publish courses, adjust pricing and reassign educators. A course needs at least one lecture before it can be published.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search title or exam…" className="h-9 pl-8 text-sm" />
        </div>
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-9 w-40 text-xs" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
        <span className="text-xs text-ink-muted">{data?.total ?? 0} courses</span>
      </div>

      {isLoading ? (
        <PageLoader label="Loading courses" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <div className="card p-10 text-center text-sm text-ink-muted">No courses match these filters.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2.5 font-semibold">Course</th>
                  <th className="px-4 py-2.5 font-semibold">Educator</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Enrolled</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Updated</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((course) => (
                  <tr key={course.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{course.title}</p>
                      <p className="text-[11px] text-ink-muted">{course.exam} · {course.lectureCount} lectures</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={course.teacher.name} color={course.teacher.avatarColor} size={24} />
                        <span className="text-xs text-ink-soft">{course.teacher.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge tone={course.status === 'published' ? 'success' : course.status === 'draft' ? 'warning' : 'neutral'}>{course.status}</Badge></td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(course.priceCents)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{course.enrolledCount}</td>
                    <td className="px-4 py-3 text-right text-[11px] text-ink-muted">{formatDate(course.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        {course.status === 'published' && (
                          <LinkButton to={`/courses/${course.slug}`} variant="ghost" size="icon" aria-label="View public page"><ExternalLink size={14} /></LinkButton>
                        )}
                        <button onClick={() => openEdit(course)} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink" aria-label={`Edit ${course.title}`}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => remove(course)} className="rounded-md p-1.5 text-ink-muted hover:bg-red-50 hover:text-danger dark:hover:bg-red-500/10" aria-label={`Archive ${course.title}`}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.total > data.limit && <Pagination page={page} total={data.total} limit={data.limit} onPage={setPage} />}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Manage ${editing?.title || 'course'}`} size="md" footer={<><Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save} loading={saving}>Save changes</Button></>}>
        <div className="space-y-4">
          <Field label="Publication status" hint="Published courses appear in the catalogue immediately." htmlFor="admin-course-status">
            <Select id="admin-course-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₹)" htmlFor="admin-course-price"><Input id="admin-course-price" type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></Field>
            <Field label="List price (₹)" htmlFor="admin-course-mrp"><Input id="admin-course-mrp" type="number" min="0" value={form.mrp} onChange={(event) => setForm({ ...form, mrp: event.target.value })} /></Field>
          </div>
          <Field label="Assigned educator" hint="Only approved teacher accounts can be assigned." htmlFor="admin-course-teacher">
            <Select id="admin-course-teacher" value={form.teacherId} onChange={(event) => setForm({ ...form, teacherId: event.target.value })}>
              {teachers?.items.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name} · {teacher.email}</option>)}
            </Select>
          </Field>
          <p className="text-[11px] text-ink-muted">Publishing requires at least one lecture. The server rejects an empty course.</p>
        </div>
      </Modal>
    </div>
  );
}
