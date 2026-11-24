import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight, BadgeCheck, CalendarDays, CheckCircle2, ChevronDown, Clock3, FileText, GraduationCap,
  Layers, Lock, PlayCircle, Radio, ShieldCheck, Star, Users, Video,
} from 'lucide-react';
import { api, ApiError, errorMessage } from '../lib/api';
import type { CourseDetail, Lecture, ReviewSummary } from '../lib/types';
import {
  Alert, Avatar, Badge, Button, Divider, EmptyState, ErrorState, KeyValue, Modal, RatingStars,
  SectionHeading, Skeleton, Textarea,
} from '../components/ui';
import { CourseCard } from '../components/cards';
import { courseTheme, categoryLabel } from '../lib/theme';
import { countdown, formatCurrency, formatDate, formatDuration, formatTime, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/cn';

function LectureRow({
  lecture,
  hasAccess,
  onPreview,
}: {
  lecture: Lecture;
  hasAccess: boolean;
  onPreview: (lecture: Lecture) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locked = !hasAccess && !lecture.isPreview;
  const action = () => {
    if (locked) return;
    if (!hasAccess) {
      onPreview(lecture);
      return;
    }
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/dashboard/lectures/${lecture.id}`)}`);
      return;
    }
    navigate(`/dashboard/lectures/${lecture.id}`);
  };

  return (
    <button
      type="button"
      onClick={action}
      className={cn('flex w-full items-center gap-3 px-4 py-3 text-left transition', locked ? 'cursor-default' : 'hover:bg-surface-2')}
    >
      <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', lecture.completed ? 'bg-success text-white' : locked ? 'bg-surface-2 text-ink-muted' : 'bg-brand-soft text-brand-strong dark:bg-brand/10')}>
        {lecture.completed ? <CheckCircle2 size={14} /> : locked ? <Lock size={12} /> : <PlayCircle size={14} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-sm', locked ? 'text-ink-muted' : 'font-medium text-ink')}>{lecture.title}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-muted">
          <Clock3 size={10} /> {formatDuration(lecture.durationSeconds)}
          {lecture.isPreview && <span className="rounded bg-success/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">PREVIEW</span>}
          {lecture.progressSeconds > 0 && !lecture.completed && <span className="text-brand-strong">{Math.round((lecture.progressSeconds / lecture.durationSeconds) * 100)}% watched</span>}
        </span>
      </span>
      {lecture.isPreview && !hasAccess && <span className="shrink-0 text-[10px] font-semibold text-brand-strong">Watch</span>}
    </button>
  );
}

function Curriculum({ detail, onPreview }: { detail: CourseDetail; onPreview: (lecture: Lecture) => void }) {
  const firstChapter = detail.curriculum[0]?.chapters[0]?.id;
  const [open, setOpen] = useState<Set<string>>(() => new Set(firstChapter ? [firstChapter] : []));
  const hasAccess = detail.access.hasAccess;

  const toggle = (id: string) => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {detail.curriculum.map((subject, index) => (
        <div key={subject.id}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-navy text-[10px] font-bold text-white dark:bg-white dark:text-navy">{index + 1}</span>
              {subject.name}
            </h3>
            <span className="text-[11px] text-ink-muted">
              {subject.chapters.reduce((sum, chapter) => sum + chapter.lectures.length, 0)} lectures ·{' '}
              {formatDuration(subject.chapters.reduce((sum, chapter) => sum + chapter.lectures.reduce((s, l) => s + l.durationSeconds, 0), 0))}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-line">
            {subject.chapters.map((chapter) => {
              const isOpen = open.has(chapter.id);
              return (
                <div key={chapter.id} className="border-b border-line last:border-0">
                  <button onClick={() => toggle(chapter.id)} className="flex w-full items-center gap-2 bg-surface px-4 py-3 text-left hover:bg-surface-2" aria-expanded={isOpen}>
                    <ChevronDown size={15} className={cn('shrink-0 text-ink-muted transition', isOpen && 'rotate-180')} />
                    <span className="flex-1 text-xs font-semibold text-ink">{chapter.name}</span>
                    <span className="text-[10px] text-ink-muted">{chapter.lectures.length} lectures</span>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-line border-t border-line bg-surface-2/40">
                      {chapter.lectures.map((lecture) => (
                        <div key={lecture.id} className="bg-surface">
                          <LectureRow lecture={lecture} hasAccess={hasAccess} onPreview={onPreview} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewSummaryBlock({ summary }: { summary: ReviewSummary }) {
  return (
    <div className="card p-5">
      <div className="flex items-end gap-4">
        <div>
          <p className="font-display text-4xl font-extrabold text-ink">{summary.average ?? '—'}</p>
          <RatingStars value={summary.average} size={13} />
          <p className="mt-1 text-[11px] text-ink-muted">{summary.total} ratings</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {summary.distribution.map((item) => (
            <div key={item.rating} className="flex items-center gap-2">
              <span className="w-3 text-right text-[10px] text-ink-muted">{item.rating}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${summary.total ? (item.count / summary.total) * 100 : 0}%` }} />
              </div>
              <span className="w-5 text-[10px] text-ink-muted">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CourseDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user } = useAuth();
  const [preview, setPreview] = useState<Lecture | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get<CourseDetail>(`/courses/${slug}`),
    enabled: Boolean(slug),
  });

  const theme = courseTheme(data?.course.theme);
  const totalLectures = useMemo(
    () => data?.curriculum.reduce((sum, subject) => sum + subject.chapters.reduce((s, chapter) => s + chapter.lectures.length, 0), 0) || 0,
    [data],
  );

  if (isLoading) {
    return (
      <div className="container-x py-10">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-3"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <div className="container-x py-16"><ErrorState message={errorMessage(error || 'Course not found.')} onRetry={() => refetch()} /></div>;
  }

  const { course, teacher, access, curriculum, tests, upcomingLive, reviews, related, totals } = data;
  const hasAccess = access.hasAccess;

  const enroll = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`);
      return;
    }
    if (access.requiresPurchase) {
      navigate(`/checkout/${course.slug}`);
      return;
    }
    setEnrolling(true);
    try {
      await api.post('/enrollments', { courseId: course.id });
      toast.success('Enrolled successfully', 'Your course is now in My Learning.');
      await queryClient.invalidateQueries({ queryKey: ['course', slug] });
      navigate(`/dashboard/learning/${course.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        navigate(`/checkout/${course.slug}`);
      } else {
        toast.error('Could not enroll', errorMessage(err));
      }
    } finally {
      setEnrolling(false);
    }
  };

  const submitReview = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/courses/${course.slug}`)}`);
      return;
    }
    setSubmittingReview(true);
    try {
      await api.post(`/courses/${course.slug}/reviews`, { rating, body: reviewBody });
      toast.success('Review saved');
      setReviewBody('');
      await queryClient.invalidateQueries({ queryKey: ['course', slug] });
    } catch (err) {
      toast.error('Could not save review', errorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden text-white" style={{ background: theme.gradient }}>
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="container-x relative py-8 sm:py-10">
          <nav className="text-[11px] text-white/50">
            <Link to="/" className="hover:text-white">Home</Link><span className="mx-1">/</span>
            <Link to="/courses" className="hover:text-white">Courses</Link><span className="mx-1">/</span>
            <span className="text-white/75">{course.title}</span>
          </nav>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="brand" className="border-white/15 bg-white/15 text-white">{course.exam}</Badge>
                <Badge className="border-white/15 bg-white/10 text-white">{categoryLabel(course.category)}</Badge>
                <Badge className="border-white/15 bg-white/10 text-white">{course.level}</Badge>
                <Badge className="border-white/15 bg-white/10 text-white">{course.language}</Badge>
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold leading-tight sm:text-4xl">{course.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">{course.subtitle || course.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-white/65">
                <span className="flex items-center gap-1.5"><RatingStars value={course.rating.average} size={12} /><span className="font-semibold text-white">{course.rating.average?.toFixed(1) || 'New'}</span> ({course.rating.count})</span>
                <span className="flex items-center gap-1.5"><Users size={13} />{course.enrolledCount} enrolled</span>
                <span className="flex items-center gap-1.5"><Video size={13} />{totals.lectures} lectures</span>
                <span className="flex items-center gap-1.5"><Clock3 size={13} />{formatDuration(totals.durationSeconds)}</span>
                <span className="flex items-center gap-1.5"><CalendarDays size={13} />{course.durationWeeks} weeks</span>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <Avatar name={teacher.name} color={teacher.avatarColor} size={38} />
                <div>
                  <p className="flex items-center gap-1.5 text-sm font-semibold">{teacher.name} <BadgeCheck size={14} className="text-sky-300" /></p>
                  <p className="text-[11px] text-white/55">{teacher.headline || `${teacher.experienceYears || 0}+ years of teaching experience`}</p>
                </div>
              </div>
              {course.learningObjectives.length > 0 && (
                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  {course.learningObjectives.slice(0, 4).map((objective) => (
                    <p key={objective} className="flex items-start gap-2 text-xs leading-relaxed text-white/80">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" /> {objective}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:row-span-2">
              <div className="rounded-2xl border border-line bg-surface p-5 text-ink shadow-2xl">
                <div className="flex items-end gap-2">
                  {course.isFree ? (
                    <span className="font-display text-3xl font-extrabold text-success">Free</span>
                  ) : (
                    <>
                      <span className="font-display text-3xl font-extrabold text-ink">{formatCurrency(course.priceCents)}</span>
                      {course.mrpCents > course.priceCents && (
                        <>
                          <span className="pb-1 text-sm text-ink-muted line-through">{formatCurrency(course.mrpCents)}</span>
                          <span className="pb-1.5 text-xs font-bold text-brand-strong">{course.discountPercent}% off</span>
                        </>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-ink-muted">
                  {course.isFree ? 'Included with every free account' : `One-time payment · ${course.validityDays}-day access`}
                </p>

                {hasAccess ? (
                  <Link to={`/dashboard/learning/${course.id}`} className="mt-4 block">
                    <Button size="lg" variant="success" className="w-full">Continue learning <ArrowRight size={15} /></Button>
                  </Link>
                ) : (
                  <Button size="lg" className="mt-4 w-full" loading={enrolling} onClick={enroll}>
                    {access.requiresPurchase ? 'Unlock this course' : user ? 'Enroll for free' : 'Sign in to enroll'}
                    <ArrowRight size={15} />
                  </Button>
                )}
                {access.requiresPurchase && (
                  <p className="mt-2 text-center text-[10px] leading-relaxed text-ink-muted">
                    Payments are not activated on this deployment. Paid checkout is shown transparently at the next step.
                  </p>
                )}

                <div className="mt-5 space-y-2.5 border-t border-line pt-4 text-xs text-ink-soft">
                  {[
                    { icon: Video, text: `${totals.lectures} recorded lectures` },
                    { icon: PlayCircle, text: `${totals.previewLectures} free preview lectures` },
                    { icon: FileText, text: 'Downloadable study notes' },
                    { icon: Layers, text: `${tests.length} practice tests included` },
                    { icon: Radio, text: 'Live doubt sessions' },
                    { icon: ShieldCheck, text: 'Progress saved across devices' },
                  ].map((item) => (
                    <p key={item.text} className="flex items-center gap-2"><item.icon size={14} className="text-brand" />{item.text}</p>
                  ))}
                </div>
                <Divider className="my-4" />
                <div className="space-y-1.5 text-[11px] text-ink-muted">
                  <p className="flex justify-between"><span>Batch timings</span><span className="font-medium text-ink">{course.batchTimings || 'Self-paced'}</span></p>
                  <p className="flex justify-between"><span>Language</span><span className="font-medium text-ink">{course.language}</span></p>
                  <p className="flex justify-between"><span>Validity</span><span className="font-medium text-ink">{course.validityDays} days</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-x mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-10">
          <section>
            <SectionHeading title="About this course" className="mb-4" />
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{course.description}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="card p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Who is this for</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{course.targetAudience || `Students preparing for ${course.exam}.`}</p>
              </div>
              <div className="card p-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Course structure</p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
                  {curriculum.length} subject{curriculum.length === 1 ? '' : 's'} · {curriculum.reduce((sum, s) => sum + s.chapters.length, 0)} chapters · {totalLectures} lectures
                </p>
              </div>
            </div>
          </section>

          <section id="curriculum">
            <SectionHeading
              title="Course curriculum"
              description={hasAccess ? 'Your progress is synced automatically as you watch.' : 'Preview lectures are open to everyone. Enroll to unlock the rest.'}
              className="mb-4"
              action={<Badge tone={hasAccess ? 'success' : 'neutral'}>{hasAccess ? 'Enrolled' : `${totals.previewLectures} previews`}</Badge>}
            />
            {curriculum.length ? <Curriculum detail={data} onPreview={setPreview} /> : <EmptyState title="Curriculum is being prepared" description="This course is still a draft. Check back soon." />}
          </section>

          {tests.length > 0 && (
            <section>
              <SectionHeading title="Tests in this course" description="Attempts are scored on the server with the marking scheme shown before you begin." className="mb-4" />
              <div className="space-y-2.5">
                {tests.map((test) => (
                  <Link key={test.id} to={`/tests/${test.id}`} className="card card-hover flex flex-wrap items-center gap-3 p-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10"><FileText size={18} /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{test.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">{test.questionCount} questions · {test.durationMinutes} min · {test.totalMarks} marks</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-strong">View <ArrowRight size={12} /></span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {upcomingLive.length > 0 && (
            <section>
              <SectionHeading title="Upcoming live classes" className="mb-4" />
              <div className="space-y-2.5">
                {upcomingLive.map((session) => (
                  <Link key={session.id} to="/live-classes" className="card card-hover flex flex-wrap items-center gap-3 p-4">
                    <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', session.status === 'live' ? 'bg-success/10 text-success' : 'bg-brand-soft text-brand-strong dark:bg-brand/10')}>
                      <Radio size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{session.title}</p>
                      <p className="mt-0.5 text-[11px] text-ink-muted">{formatDate(session.scheduledStart)} · {formatTime(session.scheduledStart)} · {session.teacher.name}</p>
                    </div>
                    <Badge tone={session.status === 'live' ? 'success' : 'info'}>{session.status === 'live' ? 'LIVE' : countdown(session.scheduledStart)}</Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section id="reviews">
            <SectionHeading title="Student reviews" description={`${reviews.summary.total} ratings from enrolled students.`} className="mb-4" />
            <div className="grid gap-5 md:grid-cols-[260px_1fr]">
              <ReviewSummaryBlock summary={reviews.summary} />
              <div className="space-y-3">
                {reviews.items.length ? reviews.items.map((review) => (
                  <div key={review.id} className="card p-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={review.studentName} color={review.avatarColor} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-ink">{review.studentName}</p>
                        <p className="text-[10px] text-ink-muted">{timeAgo(review.createdAt)}</p>
                      </div>
                      <RatingStars value={review.rating} size={11} />
                    </div>
                    {review.body && <p className="mt-2.5 text-xs leading-relaxed text-ink-soft">{review.body}</p>}
                  </div>
                )) : (
                  <EmptyState title="No written reviews yet" description="Enrolled students can be the first to review this course." className="py-10" />
                )}
              </div>
            </div>

            {hasAccess ? (
              <div className="card mt-5 p-4">
                <p className="text-sm font-semibold text-ink">Share your review</p>
                <p className="mt-0.5 text-[11px] text-ink-muted">Your feedback updates the rating shown to every visitor.</p>
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)} aria-label={`${star} star`}>
                      <Star size={22} className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-line-strong'} />
                    </button>
                  ))}
                </div>
                <Textarea
                  className="mt-3"
                  value={reviewBody}
                  onChange={(event) => setReviewBody(event.target.value)}
                  placeholder="What worked for you? Mention lectures, tests or mentor support."
                  maxLength={1000}
                />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" loading={submittingReview} onClick={submitReview}>Publish review</Button>
                </div>
              </div>
            ) : (
              <Alert tone="info" className="mt-5">Only enrolled students can review this course. Enroll to share your experience.</Alert>
            )}
          </section>

          {related.length > 0 && (
            <section>
              <SectionHeading title="Students also viewed" className="mb-4" action={<Link to="/courses" className="text-xs font-semibold text-brand-strong hover:underline">All courses <ArrowRight size={12} className="inline" /></Link>} />
              <div className="grid gap-4 sm:grid-cols-3">
                {related.map((item) => <CourseCard key={item.id} course={item} compact />)}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 space-y-4">
          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Your educator</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar name={teacher.name} color={teacher.avatarColor} size={44} />
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{teacher.name}</p>
                <p className="text-[11px] text-ink-muted">{teacher.qualification}</p>
              </div>
            </div>
            {teacher.bio && <p className="mt-3 text-xs leading-relaxed text-ink-muted">{teacher.bio}</p>}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 py-3 text-center">
              <div><p className="text-sm font-bold text-ink">{teacher.experienceYears || 0}+</p><p className="text-[9px] uppercase text-ink-muted">Years</p></div>
              <div className="border-x border-line"><p className="text-sm font-bold text-ink">{teacher.courseCount}</p><p className="text-[9px] uppercase text-ink-muted">Courses</p></div>
              <div><p className="text-sm font-bold text-ink">{teacher.studentCount}</p><p className="text-[9px] uppercase text-ink-muted">Students</p></div>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Course snapshot</p>
            <div className="mt-2">
              <KeyValue label="Subjects" value={curriculum.length} />
              <KeyValue label="Lectures" value={totals.lectures} />
              <KeyValue label="Duration" value={formatDuration(totals.durationSeconds)} />
              <KeyValue label="Tests" value={tests.length} />
              <KeyValue label="Level" value={course.level} />
              <KeyValue label="Language" value={course.language} />
            </div>
          </div>

          <div className="card bg-navy p-5 text-white">
            <GraduationCap size={22} className="text-brand" />
            <p className="mt-2 text-sm font-bold">Not sure where to start?</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">Try the free preview lectures first, then take a free practice test to benchmark yourself.</p>
            <Link to="/tests?price=free" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand">Browse free tests <ArrowRight size={12} /></Link>
          </div>
        </aside>
      </div>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.title || 'Preview lecture'}
        description="Free preview · no enrollment required"
        size="lg"
      >
        {preview && (
          <video key={preview.id} controls autoPlay className="aspect-video w-full rounded-xl bg-black" src={`/api/media/video/${preview.id}`}>
            Your browser does not support embedded video.
          </video>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-ink-muted">{preview ? `${formatDuration(preview.durationSeconds)} · ${teacher.name}` : ''}</p>
          <Link to={`/courses/${course.slug}`} onClick={() => setPreview(null)} className="text-xs font-semibold text-brand-strong hover:underline">Unlock the full course</Link>
        </div>
      </Modal>
    </div>
  );
}
