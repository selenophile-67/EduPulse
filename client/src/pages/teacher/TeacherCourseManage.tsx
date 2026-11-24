import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Clock3, ExternalLink, FileText, ListChecks, Pencil, Plus, Radio, Trash2, Upload, Video,
} from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { ManagedCourse } from '../../lib/types';
import {
  Alert, Avatar, Badge, Button, ErrorState, Field, Input, LinkButton, Modal, PageLoader, Progress, Select, Tabs, Textarea,
} from '../../components/ui';
import { formatDate, formatDuration, formatTime, timeAgo } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

type Tab = 'curriculum' | 'materials' | 'tests' | 'live' | 'students';

export function TeacherCourseManagePage() {
  const { courseId = '' } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('curriculum');
  const [subjectName, setSubjectName] = useState('');
  const [chapterDraft, setChapterDraft] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', subtitle: '', description: '', price: '', mrp: '', batchTimings: '', validityDays: '365' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [lectureOpen, setLectureOpen] = useState(false);
  const [lectureChapter, setLectureChapter] = useState('');
  const [lectureForm, setLectureForm] = useState({ title: '', description: '', minutes: '20', isPreview: false });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [savingLecture, setSavingLecture] = useState(false);
  const [lectureError, setLectureError] = useState('');
  const [materialOpen, setMaterialOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', category: 'Notes', subject: '', chapterName: '', exam: '', isPremium: false });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [materialError, setMaterialError] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['managed-course', courseId],
    queryFn: () => api.get<ManagedCourse>(`/teacher/courses/${courseId}`),
    enabled: Boolean(courseId),
  });

  const chapters = useMemo(
    () => (data?.curriculum ?? []).flatMap((subject) => subject.chapters.map((chapter) => ({ ...chapter, subjectName: subject.name }))),
    [data],
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['managed-course', courseId] });
    queryClient.invalidateQueries({ queryKey: ['teacher-courses'] });
    queryClient.invalidateQueries({ queryKey: ['teacher-overview'] });
  };

  const openEdit = () => {
    if (!data) return;
    setEditForm({
      title: data.course.title,
      subtitle: data.course.subtitle ?? '',
      description: data.course.description,
      price: String(data.course.priceCents / 100),
      mrp: String(data.course.mrpCents / 100),
      batchTimings: data.course.batchTimings ?? '',
      validityDays: String(data.course.validityDays),
    });
    setEditOpen(true);
  };

  const saveCourse = async () => {
    setSavingEdit(true);
    try {
      await api.patch(`/teacher/courses/${courseId}`, {
        title: editForm.title,
        subtitle: editForm.subtitle,
        description: editForm.description,
        priceCents: Math.round((Number(editForm.price) || 0) * 100),
        mrpCents: Math.round((Number(editForm.mrp) || 0) * 100),
        batchTimings: editForm.batchTimings,
        validityDays: Number(editForm.validityDays) || 365,
      });
      toast.success('Course updated');
      setEditOpen(false);
      refresh();
    } catch (cause) {
      toast.error('Could not save course', errorMessage(cause));
    } finally {
      setSavingEdit(false);
    }
  };

  const addSubject = async () => {
    if (subjectName.trim().length < 2) return;
    try {
      await api.post(`/teacher/courses/${courseId}/subjects`, { name: subjectName.trim() });
      setSubjectName('');
      toast.success('Subject added');
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const addChapter = async (subjectId: string) => {
    const name = (chapterDraft[subjectId] || '').trim();
    if (name.length < 2) return;
    try {
      await api.post(`/subjects/${subjectId}/chapters`, { name });
      setChapterDraft({ ...chapterDraft, [subjectId]: '' });
      toast.success('Chapter added');
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const removeSubject = async (subjectId: string, name: string) => {
    if (!window.confirm(`Delete “${name}” and all of its chapters and lectures? This cannot be undone.`)) return;
    try {
      await api.delete(`/subjects/${subjectId}`);
      toast.success('Subject deleted');
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const removeChapter = async (chapterId: string, name: string) => {
    if (!window.confirm(`Delete chapter “${name}”? Its lectures will also be removed.`)) return;
    try {
      await api.delete(`/chapters/${chapterId}`);
      toast.success('Chapter deleted');
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const removeLecture = async (lectureId: string, title: string) => {
    if (!window.confirm(`Delete lecture “${title}”?`)) return;
    try {
      await api.delete(`/teacher/lectures/${lectureId}`);
      toast.success('Lecture deleted');
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  const openLecture = (chapterId: string) => {
    setLectureChapter(chapterId);
    setLectureForm({ title: '', description: '', minutes: '20', isPreview: false });
    setVideoFile(null);
    setLectureError('');
    setLectureOpen(true);
  };

  const saveLecture = async () => {
    setLectureError('');
    setSavingLecture(true);
    try {
      let videoKey = '';
      if (videoFile) {
        const form = new FormData();
        form.append('video', videoFile);
        const uploaded = await api.upload<{ upload: { key: string } }>('/teacher/uploads/video', form);
        videoKey = uploaded.upload.key;
      }
      await api.post('/teacher/lectures', {
        chapterId: lectureChapter,
        title: lectureForm.title,
        description: lectureForm.description,
        durationSeconds: Math.max(30, Math.round((Number(lectureForm.minutes) || 20) * 60)),
        isPreview: lectureForm.isPreview,
        videoKey,
      });
      toast.success(videoFile ? 'Lecture published with video' : 'Lecture added', videoFile ? 'Enrolled students were notified.' : 'Upload the video later from the lecture list.');
      setLectureOpen(false);
      refresh();
    } catch (cause) {
      setLectureError(errorMessage(cause));
    } finally {
      setSavingLecture(false);
    }
  };

  const saveMaterial = async () => {
    setMaterialError('');
    if (!pdfFile) {
      setMaterialError('Choose a PDF file to upload.');
      return;
    }
    setSavingMaterial(true);
    try {
      const form = new FormData();
      form.append('pdf', pdfFile);
      const uploaded = await api.upload<{ upload: { key: string } }>('/teacher/uploads/pdf', form);
      await api.post('/teacher/materials', {
        title: materialForm.title,
        description: materialForm.description,
        exam: materialForm.exam || data?.course.exam || '',
        category: materialForm.category,
        subject: materialForm.subject,
        chapterName: materialForm.chapterName,
        isPremium: materialForm.isPremium,
        courseId,
        fileKey: uploaded.upload.key,
      });
      toast.success('Material uploaded');
      setMaterialOpen(false);
      setPdfFile(null);
      setMaterialForm({ title: '', description: '', category: 'Notes', subject: '', chapterName: '', exam: '', isPremium: false });
      refresh();
    } catch (cause) {
      setMaterialError(errorMessage(cause));
    } finally {
      setSavingMaterial(false);
    }
  };

  const removeMaterial = async (materialId: string, title: string) => {
    if (!window.confirm(`Delete material “${title}”? Students will lose access immediately.`)) return;
    try {
      await api.delete(`/teacher/materials/${materialId}`);
      toast.success('Material removed');
      refresh();
    } catch (cause) {
      toast.error(errorMessage(cause));
    }
  };

  if (isLoading) return <PageLoader label="Loading course workspace" />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const { course } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        <Link to="/teacher/courses" className="inline-flex items-center gap-1 hover:text-ink"><ArrowLeft size={13} /> My courses</Link>
        <span>/</span>
        <span className="truncate text-ink-soft">{course.title}</span>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone={course.status === 'published' ? 'success' : course.status === 'draft' ? 'warning' : 'neutral'}>{course.status}</Badge>
              <Badge tone="neutral">{course.exam}</Badge>
              <Badge tone="neutral">{course.level}</Badge>
              {course.isFree && <Badge tone="info">Free</Badge>}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink">{course.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">{course.subtitle || course.category}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={openEdit} icon={<Pencil size={13} />}>Edit details</Button>
            {course.status === 'published' && (
              <LinkButton to={`/courses/${course.slug}`} variant="outline" size="sm" icon={<ExternalLink size={13} />}>View public page</LinkButton>
            )}
            <LinkButton to={`/teacher/tests?create=1&courseId=${course.id}`} size="sm" icon={<ListChecks size={13} />}>New test</LinkButton>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: 'Enrolments', value: data.stats.enrollments },
            { label: 'Lectures', value: data.stats.lectures },
            { label: 'Tests', value: data.stats.tests },
            { label: 'Materials', value: data.stats.materials },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-line bg-surface-2 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-ink-muted">{item.label}</p>
              <p className="text-lg font-bold text-ink">{item.value}</p>
            </div>
          ))}
        </div>

        {course.status === 'draft' && (
          <Alert tone="info" className="mt-4" title="Publishing is an admin step">
            Add lectures and materials, then ask an administrator to publish. The public catalogue only lists published courses.
          </Alert>
        )}
      </div>

      <Tabs
        value={tab}
        onChange={(next) => setTab(next as Tab)}
        tabs={[
          { value: 'curriculum', label: 'Curriculum' },
          { value: 'materials', label: 'Materials' },
          { value: 'tests', label: 'Tests' },
          { value: 'live', label: 'Live classes' },
          { value: 'students', label: 'Students' },
        ]}
      />

      {tab === 'curriculum' && (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-end gap-2 p-4">
            <Field label="Add a subject" className="min-w-[220px] flex-1" htmlFor="subject-name">
              <Input id="subject-name" value={subjectName} onChange={(event) => setSubjectName(event.target.value)} placeholder="Physics" />
            </Field>
            <Button onClick={addSubject} disabled={subjectName.trim().length < 2} icon={<Plus size={14} />}>Add subject</Button>
          </div>

          {data.curriculum.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm font-semibold text-ink">No curriculum yet</p>
              <p className="mt-1 text-xs text-ink-muted">Add a subject such as Physics, then chapters and lectures inside it.</p>
            </div>
          ) : (
            data.curriculum.map((subject) => (
              <div key={subject.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-ink">{subject.name}</h2>
                  <button onClick={() => removeSubject(subject.id, subject.name)} className="inline-flex items-center gap-1 text-[11px] font-medium text-danger hover:underline">
                    <Trash2 size={12} /> Delete subject
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {subject.chapters.map((chapter) => (
                    <div key={chapter.id} className="rounded-xl border border-line bg-surface-2 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-ink">{chapter.name}</p>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openLecture(chapter.id)} className="inline-flex items-center gap-1 rounded-md border border-line bg-surface px-2 py-1 text-[11px] font-semibold text-ink-soft hover:border-brand hover:text-brand-strong">
                            <Plus size={11} /> Lecture
                          </button>
                          <button onClick={() => removeChapter(chapter.id, chapter.name)} className="rounded-md p-1 text-ink-muted hover:text-danger" aria-label={`Delete chapter ${chapter.name}`}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {chapter.lectures.length === 0 ? (
                        <p className="mt-2 text-[11px] text-ink-muted">No lectures in this chapter yet.</p>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {chapter.lectures.map((lecture, index) => (
                            <div key={lecture.id} className="flex items-center gap-2 rounded-lg bg-surface px-2.5 py-2 text-xs">
                              <span className="text-[10px] font-semibold text-ink-muted">{index + 1}</span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-medium text-ink">{lecture.title}</p>
                                <p className="flex flex-wrap items-center gap-2 text-[10px] text-ink-muted">
                                  <span className="inline-flex items-center gap-0.5"><Clock3 size={10} /> {formatDuration(lecture.durationSeconds)}</span>
                                  {lecture.isPreview && <span className="text-brand-strong">Preview</span>}
                                  {lecture.hasVideo ? (
                                    <span className="inline-flex items-center gap-0.5 text-success"><Video size={10} /> Video ready</span>
                                  ) : (
                                    <span className="inline-flex items-center gap-0.5 text-amber-600"><Upload size={10} /> No video uploaded</span>
                                  )}
                                </p>
                              </div>
                              <button onClick={() => removeLecture(lecture.id, lecture.title)} className="rounded p-1 text-ink-muted hover:text-danger" aria-label={`Delete lecture ${lecture.title}`}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {subject.ungroupedLectures.length > 0 && (
                    <div className="rounded-xl border border-dashed border-line p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Unassigned lectures</p>
                      <div className="mt-1.5 space-y-1">
                        {subject.ungroupedLectures.map((lecture) => (
                          <div key={lecture.id} className="flex items-center justify-between gap-2 text-xs">
                            <span className="truncate text-ink-soft">{lecture.title}</span>
                            <button onClick={() => removeLecture(lecture.id, lecture.title)} className="rounded p-1 text-ink-muted hover:text-danger" aria-label={`Delete lecture ${lecture.title}`}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-end gap-2">
                    <Field label="Add a chapter" className="min-w-[200px] flex-1" htmlFor={`chapter-${subject.id}`}>
                      <Input
                        id={`chapter-${subject.id}`}
                        value={chapterDraft[subject.id] || ''}
                        onChange={(event) => setChapterDraft({ ...chapterDraft, [subject.id]: event.target.value })}
                        placeholder="Kinematics"
                      />
                    </Field>
                    <Button variant="secondary" size="sm" onClick={() => addChapter(subject.id)} disabled={(chapterDraft[subject.id] || '').trim().length < 2} icon={<Plus size={13} />}>
                      Add chapter
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-muted">PDFs attached to this course are gated for enrolled students.</p>
            <Button size="sm" onClick={() => { setMaterialError(''); setMaterialForm({ ...materialForm, exam: course.exam }); setMaterialOpen(true); }} icon={<Plus size={13} />}>Upload material</Button>
          </div>
          {data.materials.length === 0 ? (
            <div className="card p-10 text-center text-sm text-ink-muted">No materials uploaded for this course yet.</div>
          ) : (
            <div className="card divide-y divide-line">
              {data.materials.map((material) => (
                <div key={material.id} className="flex flex-wrap items-center gap-3 p-3.5">
                  <FileText size={16} className="shrink-0 text-ink-muted" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{material.title}</p>
                    <p className="text-[11px] text-ink-muted">
                      {material.category}{material.subject ? ` · ${material.subject}` : ''} · {material.downloadCount} downloads · {timeAgo(material.createdAt)}
                    </p>
                  </div>
                  {material.isPremium && <Badge tone="brand">Premium</Badge>}
                  <button onClick={() => removeMaterial(material.id, material.title)} className="rounded-md p-1.5 text-ink-muted hover:text-danger" aria-label={`Delete ${material.title}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'tests' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-muted">Tests attached to this course are attemptable only by enrolled students.</p>
            <LinkButton to={`/teacher/tests?create=1&courseId=${course.id}`} size="sm" icon={<Plus size={13} />}>Create test</LinkButton>
          </div>
          {data.tests.length === 0 ? (
            <div className="card p-10 text-center text-sm text-ink-muted">No tests for this course yet.</div>
          ) : (
            <div className="card divide-y divide-line">
              {data.tests.map((test) => (
                <div key={test.id} className="flex flex-wrap items-center gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <Link to={`/teacher/tests/${test.id}`} className="block truncate text-sm font-medium text-ink hover:text-brand-strong">{test.title}</Link>
                    <p className="text-[11px] text-ink-muted">
                      {test.durationMinutes} min · {test.questionCount} questions · {test.totalMarks} marks · {test.attemptCount} attempts
                    </p>
                  </div>
                  <Badge tone={test.status === 'published' ? 'success' : 'warning'}>{test.status}</Badge>
                  <LinkButton to={`/teacher/tests/${test.id}`} variant="secondary" size="sm">Open builder</LinkButton>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'live' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-muted">Sessions appear here once scheduled. Streaming requires LiveKit credentials on the deployment.</p>
            <LinkButton to="/teacher/live-classes" size="sm" icon={<Radio size={13} />}>Manage schedule</LinkButton>
          </div>
          {data.liveClasses.length === 0 ? (
            <div className="card p-10 text-center text-sm text-ink-muted">No live classes scheduled for this course.</div>
          ) : (
            <div className="card divide-y divide-line">
              {data.liveClasses.map((session) => (
                <div key={session.id} className="flex flex-wrap items-center gap-3 p-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{session.title}</p>
                    <p className="text-[11px] text-ink-muted">{formatDate(session.scheduledStart)} · {formatTime(session.scheduledStart)} – {formatTime(session.scheduledEnd)}</p>
                  </div>
                  <Badge tone={session.status === 'cancelled' ? 'danger' : session.status === 'completed' ? 'neutral' : 'info'}>{session.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'students' && (
        <div className="card overflow-hidden">
          {data.students.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink-muted">No students enrolled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-2.5 font-semibold">Student</th>
                    <th className="px-4 py-2.5 font-semibold">Enrolled</th>
                    <th className="px-4 py-2.5 font-semibold">Progress</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Avg accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((student) => (
                    <tr key={student.id} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Avatar name={student.name} color={student.avatar_color} size={26} />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-ink">{student.name}</p>
                            <p className="truncate text-[11px] text-ink-muted">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-ink-muted">{formatDate(student.enrolled_at)}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Progress value={student.progressPercent} size="sm" className="w-24" />
                          <span className="text-[11px] text-ink-muted">{student.progressPercent}%</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-ink-muted">{student.completed_lectures}/{student.total_lectures} lectures</p>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{student.avg_accuracy === null ? '—' : `${student.avg_accuracy}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit course details" size="lg" footer={<><Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={saveCourse} loading={savingEdit}>Save changes</Button></>}>
        <div className="space-y-4">
          <Field label="Title" htmlFor="edit-title"><Input id="edit-title" value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} /></Field>
          <Field label="Subtitle" htmlFor="edit-subtitle"><Input id="edit-subtitle" value={editForm.subtitle} onChange={(event) => setEditForm({ ...editForm, subtitle: event.target.value })} /></Field>
          <Field label="Description" htmlFor="edit-description"><Textarea id="edit-description" rows={4} value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price (₹)" htmlFor="edit-price"><Input id="edit-price" type="number" min="0" value={editForm.price} onChange={(event) => setEditForm({ ...editForm, price: event.target.value })} /></Field>
            <Field label="List price (₹)" htmlFor="edit-mrp"><Input id="edit-mrp" type="number" min="0" value={editForm.mrp} onChange={(event) => setEditForm({ ...editForm, mrp: event.target.value })} /></Field>
            <Field label="Validity (days)" htmlFor="edit-validity"><Input id="edit-validity" type="number" min="30" value={editForm.validityDays} onChange={(event) => setEditForm({ ...editForm, validityDays: event.target.value })} /></Field>
          </div>
          <Field label="Batch timings" htmlFor="edit-batch"><Input id="edit-batch" value={editForm.batchTimings} onChange={(event) => setEditForm({ ...editForm, batchTimings: event.target.value })} /></Field>
        </div>
      </Modal>

      <Modal
        open={lectureOpen}
        onClose={() => setLectureOpen(false)}
        title="Add a lecture"
        description="Videos are uploaded to this deployment's storage and gated to enrolled students."
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setLectureOpen(false)}>Cancel</Button><Button onClick={saveLecture} loading={savingLecture}>Add lecture</Button></>}
      >
        <div className="space-y-4">
          {lectureError && <Alert tone="danger">{lectureError}</Alert>}
          <Field label="Chapter" htmlFor="lecture-chapter">
            <Select id="lecture-chapter" value={lectureChapter} onChange={(event) => setLectureChapter(event.target.value)}>
              {chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.subjectName} · {chapter.name}</option>)}
            </Select>
          </Field>
          <Field label="Lecture title" htmlFor="lecture-title"><Input id="lecture-title" value={lectureForm.title} onChange={(event) => setLectureForm({ ...lectureForm, title: event.target.value })} placeholder="Projectile motion — basics" /></Field>
          <Field label="Description" htmlFor="lecture-description"><Textarea id="lecture-description" rows={2} value={lectureForm.description} onChange={(event) => setLectureForm({ ...lectureForm, description: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duration (minutes)" hint="Minimum 1 minute." htmlFor="lecture-duration">
              <Input id="lecture-duration" type="number" min="1" max="600" value={lectureForm.minutes} onChange={(event) => setLectureForm({ ...lectureForm, minutes: event.target.value })} />
            </Field>
            <div className="pt-6">
              <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
                <input type="checkbox" checked={lectureForm.isPreview} onChange={(event) => setLectureForm({ ...lectureForm, isPreview: event.target.checked })} className="h-4 w-4 rounded border-line accent-brand" />
                Free preview for signed-out visitors
              </label>
            </div>
          </div>
          <Field label="Video file (optional)" hint="MP4 or WEBM, up to 400 MB. You can attach a video later." htmlFor="lecture-video">
            <input id="lecture-video" type="file" accept="video/mp4,video/webm" onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)} className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft hover:file:bg-surface-3" />
          </Field>
          {savingLecture && videoFile && <p className="text-xs text-ink-muted">Uploading video and creating lecture…</p>}
        </div>
      </Modal>

      <Modal
        open={materialOpen}
        onClose={() => setMaterialOpen(false)}
        title="Upload study material"
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setMaterialOpen(false)}>Cancel</Button><Button onClick={saveMaterial} loading={savingMaterial}>Upload PDF</Button></>}
      >
        <div className="space-y-4">
          {materialError && <Alert tone="danger">{materialError}</Alert>}
          <Field label="Title" htmlFor="material-title"><Input id="material-title" value={materialForm.title} onChange={(event) => setMaterialForm({ ...materialForm, title: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category" htmlFor="material-category">
              <Select id="material-category" value={materialForm.category} onChange={(event) => setMaterialForm({ ...materialForm, category: event.target.value })}>
                {['Notes', 'Formula Sheet', 'Previous Papers', 'Practice Set', 'Solution'].map((category) => <option key={category} value={category}>{category}</option>)}
              </Select>
            </Field>
            <Field label="Subject" htmlFor="material-subject"><Input id="material-subject" value={materialForm.subject} onChange={(event) => setMaterialForm({ ...materialForm, subject: event.target.value })} /></Field>
            <Field label="Chapter" htmlFor="material-chapter"><Input id="material-chapter" value={materialForm.chapterName} onChange={(event) => setMaterialForm({ ...materialForm, chapterName: event.target.value })} /></Field>
          </div>
          <Field label="Description" htmlFor="material-description"><Textarea id="material-description" rows={2} value={materialForm.description} onChange={(event) => setMaterialForm({ ...materialForm, description: event.target.value })} /></Field>
          <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <input type="checkbox" checked={materialForm.isPremium} onChange={(event) => setMaterialForm({ ...materialForm, isPremium: event.target.checked })} className="h-4 w-4 rounded border-line accent-brand" />
            Premium — restrict downloads to enrolled students
          </label>
          <Field label="PDF file" hint="Maximum 30 MB." htmlFor="material-pdf">
            <input id="material-pdf" type="file" accept="application/pdf" onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)} className="block w-full text-xs text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-ink-soft hover:file:bg-surface-3" />
          </Field>
          <p className="text-[11px] text-ink-muted">Exam: {course.exam}. Materials are listed on the course page and the study materials library.</p>
        </div>
      </Modal>
    </div>
  );
}
