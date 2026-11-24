import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Radio, Video } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { Course, LiveClass } from '../../lib/types';
import { Alert, Badge, Button, ErrorState, Field, Input, LinkButton, Modal, PageLoader, Select, Tabs, Textarea } from '../../components/ui';
import { countdown, formatDate, formatTime } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

type StatusTab = 'all' | 'scheduled' | 'live' | 'completed' | 'cancelled';

export function TeacherLiveClassesPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<StatusTab>('all');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ title: '', description: '', courseId: '', start: '', end: '', joinUrl: '' });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['teacher-live-classes'],
    queryFn: () => api.get<{ liveClasses: LiveClass[]; streaming: { configured: boolean; provider: string } }>('/teacher/live-classes'),
  });
  const { data: courseData } = useQuery({
    queryKey: ['teacher-courses'],
    queryFn: () => api.get<{ courses: Course[] }>('/teacher/courses'),
  });

  const sessions = useMemo(() => {
    const list = data?.liveClasses ?? [];
    return tab === 'all' ? list : list.filter((session) => session.status === tab);
  }, [data, tab]);

  const schedule = async () => {
    setFormError('');
    if (!form.start || !form.end) {
      setFormError('Choose both a start and end time.');
      return;
    }
    if (new Date(form.end).getTime() <= new Date(form.start).getTime()) {
      setFormError('The class must end after it starts.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/live-classes', {
        title: form.title,
        description: form.description,
        courseId: form.courseId || null,
        scheduledStart: new Date(form.start).toISOString(),
        scheduledEnd: new Date(form.end).toISOString(),
        joinUrl: form.joinUrl,
      });
      toast.success('Class scheduled', form.courseId ? 'Enrolled students were notified.' : 'The class is on the public schedule.');
      setOpen(false);
      setForm({ title: '', description: '', courseId: '', start: '', end: '', joinUrl: '' });
      queryClient.invalidateQueries({ queryKey: ['teacher-live-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview'] });
    } catch (cause) {
      setFormError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const cancel = async (session: LiveClass) => {
    if (!window.confirm(`Cancel “${session.title}”? Enrolled students will be notified.`)) return;
    try {
      await api.patch(`/live-classes/${session.id}`, { status: 'cancelled' });
      toast.success('Class cancelled');
      queryClient.invalidateQueries({ queryKey: ['teacher-live-classes'] });
      queryClient.invalidateQueries({ queryKey: ['teacher-overview'] });
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  if (isLoading) return <PageLoader label="Loading live classes" />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Live classes</h1>
          <p className="mt-1 text-sm text-ink-muted">Schedule sessions, share an external join link, or use LiveKit when configured.</p>
        </div>
        <Button onClick={() => { setFormError(''); setOpen(true); }} icon={<CalendarPlus size={15} />}>Schedule class</Button>
      </div>

      {data.streaming.configured ? (
        <Alert tone="success" title="In-app streaming is configured">
          {data.streaming.provider} credentials are detected. Students can join rooms directly from their dashboard.
        </Alert>
      ) : (
        <Alert tone="warning" title="In-app streaming is not configured">
          Without LiveKit credentials, rooms cannot be streamed in-app. You can still schedule classes and paste a join link from Zoom or Meet — students will be sent there.
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'all', label: 'All' },
          { value: 'scheduled', label: 'Upcoming' },
          { value: 'live', label: 'Live now' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' },
        ]}
      />

      {sessions.length === 0 ? (
        <div className="card p-10 text-center">
          <Radio size={24} className="mx-auto text-ink-muted" />
          <p className="mt-3 text-sm font-semibold text-ink">No classes in this view</p>
          <p className="mt-1 text-xs text-ink-muted">Schedule a class and students enrolled in the selected course get notified.</p>
          <Button className="mt-4" size="sm" onClick={() => setOpen(true)} icon={<CalendarPlus size={13} />}>Schedule class</Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sessions.map((session) => (
            <div key={session.id} className="card flex flex-wrap items-center gap-3 p-4">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${session.status === 'live' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 'bg-surface-2 text-ink-muted'}`}>
                <Video size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-ink">{session.title}</p>
                  <Badge tone={session.status === 'live' ? 'danger' : session.status === 'scheduled' ? 'info' : session.status === 'cancelled' ? 'danger' : 'neutral'}>{session.status}</Badge>
                  {session.hasJoinLink && <Badge tone="neutral">External link</Badge>}
                </div>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {session.courseTitle || 'Open session'} · {formatDate(session.scheduledStart)} · {formatTime(session.scheduledStart)}–{formatTime(session.scheduledEnd)}
                </p>
                <p className="text-[11px] text-ink-muted">
                  {session.attendeeCount} attendees{session.status === 'scheduled' ? ` · starts ${countdown(session.scheduledStart)}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {session.status === 'scheduled' || session.status === 'live' ? (
                  <>
                    <LinkButton to={`/live-classes?status=${session.status === 'live' ? 'live' : 'upcoming'}`} variant="secondary" size="sm">Public page</LinkButton>
                    <Button variant="danger" size="sm" onClick={() => cancel(session)}>Cancel</Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Schedule a live class" size="lg" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={schedule} loading={saving}>Schedule class</Button></>}>
        <div className="space-y-4">
          {formError && <Alert tone="danger">{formError}</Alert>}
          <Field label="Title" htmlFor="live-title"><Input id="live-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Doubt session — rotational motion" /></Field>
          <Field label="Course" hint="Leave empty to publish a free open session to all students." htmlFor="live-course">
            <Select id="live-course" value={form.courseId} onChange={(event) => setForm({ ...form, courseId: event.target.value })}>
              <option value="">Open session (no course)</option>
              {courseData?.courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </Select>
          </Field>
          <Field label="Description" htmlFor="live-description"><Textarea id="live-description" rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts" htmlFor="live-start"><Input id="live-start" type="datetime-local" value={form.start} onChange={(event) => setForm({ ...form, start: event.target.value })} /></Field>
            <Field label="Ends" htmlFor="live-end"><Input id="live-end" type="datetime-local" value={form.end} onChange={(event) => setForm({ ...form, end: event.target.value })} /></Field>
          </div>
          <Field label="External join link (optional)" hint="Used when LiveKit is not configured. Must be a full https URL." htmlFor="live-link">
            <Input id="live-link" value={form.joinUrl} onChange={(event) => setForm({ ...form, joinUrl: event.target.value })} placeholder="https://meet.example.com/your-room" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
