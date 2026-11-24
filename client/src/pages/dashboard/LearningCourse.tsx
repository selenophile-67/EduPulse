import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, BookOpen, CalendarDays, ChevronDown, Clock3, FileText, Lock, PlayCircle, Video,
} from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { MyCourse } from '../../lib/types';
import {
  Badge, EmptyState, ErrorState, LinkButton, PageLoader, Progress, SectionHeading, Tabs,
} from '../../components/ui';
import { LiveClassCard, LectureStatus, TestCard } from '../../components/cards';
import { courseTheme } from '../../lib/theme';
import { formatDuration, formatDate, formatTime } from '../../lib/format';
import { cn } from '../../lib/cn';

type Tab = 'curriculum' | 'tests' | 'live' | 'materials';

export function LearningCoursePage() {
  const { courseId = '' } = useParams();
  const [tab, setTab] = useState<Tab>('curriculum');
  const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({});

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-course', courseId],
    queryFn: () => api.get<MyCourse>(`/learning/courses/${courseId}`),
    enabled: Boolean(courseId),
  });

  if (isLoading) return <PageLoader label="Loading your course" />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />;

  const { course, curriculum, progress, tests, live, materials } = data;
  const theme = courseTheme(course.theme);
  const allLectures = curriculum.flatMap((subject) => subject.chapters.flatMap((chapter) => chapter.lectures));
  const nextLectureId = progress.nextLectureId;

  const toggleChapter = (id: string) => setOpenChapters((current) => ({ ...current, [id]: !current[id] }));

  return (
    <div className="space-y-6">
      <Link to="/dashboard/learning" className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink">
        <ArrowLeft size={13} /> My learning
      </Link>

      <section className="relative overflow-hidden rounded-2xl text-white" style={{ background: theme.gradient }}>
        <div className="bg-dots absolute inset-0 opacity-20" />
        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
            <span>{course.exam}</span><span>·</span><span>{course.level}</span><span>·</span><span>{course.language}</span>
          </div>
          <h1 className="mt-2 max-w-2xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">{course.title}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-white/65">{course.subtitle || course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-white/60">
            <span className="inline-flex items-center gap-1.5"><PlayCircle size={13} /> {allLectures.length} lectures</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={13} /> {formatDuration(allLectures.reduce((sum, lecture) => sum + lecture.durationSeconds, 0))}</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={13} /> {course.teacher.name}</span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> Valid for {course.validityDays} days</span>
          </div>
          <div className="mt-5 max-w-md">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span>{progress.completedLectures}/{progress.totalLectures} lectures completed</span>
              <span className="font-semibold text-white">{progress.percent}%</span>
            </div>
            <Progress value={progress.percent} tone="success" className="mt-1.5 bg-white/15" />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <LinkButton
              to={nextLectureId ? `/dashboard/lectures/${nextLectureId}` : `/courses/${course.slug}`}
              variant="white"
              icon={<PlayCircle size={15} />}
            >
              {progress.completedLectures > 0 ? 'Resume next lecture' : 'Start learning'}
            </LinkButton>
            <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white/85 hover:border-white hover:text-white">
              Course page <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'curriculum', label: 'Curriculum', count: allLectures.length },
          { value: 'tests', label: 'Tests', count: tests.length },
          { value: 'live', label: 'Live classes', count: live.length },
          { value: 'materials', label: 'Materials', count: materials.length },
        ]}
      />

      {tab === 'curriculum' && (
        <div className="space-y-4">
          {curriculum.length === 0 ? (
            <EmptyState title="Curriculum is being prepared" description="Your educator has not added subjects and lectures yet." />
          ) : (
            curriculum.map((subject) => (
              <section key={subject.id} className="card overflow-hidden">
                <div className="border-b border-line bg-surface-2/60 px-4 py-3">
                  <h2 className="text-sm font-bold text-ink">{subject.name}</h2>
                  <p className="text-[11px] text-ink-muted">{subject.chapters.length} chapters · {subject.chapters.reduce((sum, chapter) => sum + chapter.lectures.length, 0)} lectures</p>
                </div>
                <div className="divide-y divide-line">
                  {subject.chapters.map((chapter) => {
                    const open = openChapters[chapter.id] ?? true;
                    const completed = chapter.lectures.filter((lecture) => lecture.completed).length;
                    return (
                      <div key={chapter.id}>
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapter.id)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface-2/50"
                          aria-expanded={open}
                        >
                          <ChevronDown size={15} className={cn('shrink-0 text-ink-muted transition-transform', open && 'rotate-180')} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-ink">{chapter.name}</p>
                            <p className="text-[11px] text-ink-muted">{completed}/{chapter.lectures.length} completed</p>
                          </div>
                          <Progress value={chapter.lectures.length ? (completed / chapter.lectures.length) * 100 : 0} className="hidden max-w-24 sm:block" size="sm" />
                        </button>
                        {open && (
                          <ul className="pb-2">
                            {chapter.lectures.map((lecture) => (
                              <li key={lecture.id}>
                                <Link
                                  to={`/dashboard/lectures/${lecture.id}`}
                                  className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-surface-2/60"
                                >
                                  <LectureStatus completed={lecture.completed} />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-medium text-ink group-hover:text-brand-strong">{lecture.title}</p>
                                    <p className="text-[10px] text-ink-muted">
                                      {formatDuration(lecture.durationSeconds)}
                                      {lecture.progressSeconds > 0 && !lecture.completed ? ` · resume at ${formatDuration(lecture.progressSeconds)}` : ''}
                                      {lecture.isPreview ? ' · preview' : ''}
                                    </p>
                                  </div>
                                  <PlayCircle size={15} className="shrink-0 text-ink-muted group-hover:text-brand-strong" />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {tab === 'tests' && (
        <div>
          <SectionHeading eyebrow="Assessments" title="Tests in this course" />
          {tests.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} title="No tests published yet" description="Course tests appear here once your educator publishes them." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {tests.map((test) => <TestCard key={test.id} test={test} />)}
            </div>
          )}
        </div>
      )}

      {tab === 'live' && (
        <div>
          <SectionHeading eyebrow="Live schedule" title="Upcoming classes" action={<Link to="/live-classes" className="text-xs font-semibold text-brand-strong">All sessions</Link>} />
          {live.length === 0 ? (
            <EmptyState icon={<Video size={20} />} title="No upcoming live classes" description="Your educator will notify you when the next session is scheduled." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {live.map((session) => (
                <div key={session.id}>
                  <LiveClassCard session={session} compact />
                  <p className="mt-1.5 px-1 text-[10px] text-ink-muted">{formatDate(session.scheduledStart)} · {formatTime(session.scheduledStart)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'materials' && (
        <div>
          <SectionHeading eyebrow="Resources" title="Course materials" action={<Link to="/materials" className="text-xs font-semibold text-brand-strong">Library</Link>} />
          {materials.length === 0 ? (
            <EmptyState icon={<FileText size={20} />} title="No materials uploaded yet" description="Notes and PDFs for this course will appear here." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {materials.map((material) => (
                <Link key={material.id} to={`/materials?highlight=${material.id}`} className="card card-hover flex items-center gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300"><FileText size={18} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{material.title}</p>
                    <p className="text-[11px] text-ink-muted">{material.category}</p>
                  </div>
                  {material.isPremium ? <Badge tone="warning"><Lock size={10} /> Premium</Badge> : <Badge tone="success">Free</Badge>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
