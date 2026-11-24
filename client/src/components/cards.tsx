import { Link } from 'react-router-dom';
import {
  ArrowRight, Atom, BookOpen, Briefcase, Clock3, Cpu, FileText, GraduationCap, Landmark, Layers,
  Radio, School, Sparkles, Stethoscope, Users, Video, CalendarDays, Timer, Trophy, Download, Lock,
} from 'lucide-react';
import { Avatar, Badge, RatingStars } from './ui';
import { cn } from '../lib/cn';
import { courseTheme, categoryLabel } from '../lib/theme';
import { formatCompact, formatCurrency, formatDate, formatDuration, formatNumber, formatTime, testTypeLabel, countdown } from '../lib/format';
import type { Course, LiveClass, Material, Test } from '../lib/types';

export const CATEGORY_ICONS: Record<string, typeof Atom> = {
  jee: Atom,
  neet: Stethoscope,
  upsc: Landmark,
  ssc: FileText,
  banking: Briefcase,
  gate: Cpu,
  cuet: GraduationCap,
  school: School,
  foundation: Sparkles,
};

export function CategoryIcon({ slug, size = 20, className }: { slug: string; size?: number; className?: string }) {
  const Icon = CATEGORY_ICONS[slug] || BookOpen;
  return <Icon size={size} className={className} />;
}

export function CourseCard({ course, compact = false }: { course: Course; compact?: boolean }) {
  const theme = courseTheme(course.theme);
  const teacherName = course.teacher?.name || 'EduPulse educator';
  return (
    <Link
      to={`/courses/${course.slug}`}
      className="card card-hover group flex h-full flex-col overflow-hidden"
    >
      <div className="relative overflow-hidden p-4 pb-3 text-white" style={{ background: theme.gradient }}>
        <div className="bg-dots absolute inset-0 opacity-20" />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold backdrop-blur">{course.exam}</span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur">{categoryLabel(course.category)}</span>
          </div>
          {course.isFree ? (
            <span className="rounded-full bg-success px-2.5 py-0.5 text-[11px] font-bold text-white">FREE</span>
          ) : course.discountPercent > 0 ? (
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold">-{course.discountPercent}%</span>
          ) : null}
        </div>
        <div className="relative mt-5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">{course.level} · {course.language}</p>
            <h3 className={cn('mt-1 line-clamp-2 font-display font-bold leading-snug', compact ? 'text-[15px]' : 'text-base')}>
              {course.title}
            </h3>
          </div>
          <span className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur transition group-hover:bg-white group-hover:text-navy">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3.5">
        {!compact && (
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-muted">{course.subtitle || course.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <Avatar name={teacherName} color={course.teacher?.avatarColor} size={22} />
          <span className="truncate text-xs font-medium text-ink-soft">{teacherName}</span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
          <RatingStars value={course.rating.average} size={11} showValue={Boolean(course.rating.average)} count={course.rating.count} />
          <span className="inline-flex items-center gap-1"><Video size={11} />{course.lectureCount} lectures</span>
          <span className="inline-flex items-center gap-1"><Clock3 size={11} />{formatDuration(course.totalDurationSeconds)}</span>
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink-muted">
            <Users size={12} />
            {formatCompact(course.enrolledCount)} learners
          </div>
          <div className="text-right">
            {course.isFree ? (
              <span className="text-sm font-bold text-success">Free</span>
            ) : (
              <>
                <span className="text-[15px] font-bold text-ink">{formatCurrency(course.priceCents)}</span>
                {course.mrpCents > course.priceCents && (
                  <span className="ml-1.5 text-[11px] text-ink-muted line-through">{formatCurrency(course.mrpCents)}</span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MaterialCard({ material, onOpen }: { material: Material; onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="card card-hover group flex h-full w-full flex-col p-4 text-left"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300">
          <FileText size={19} />
        </span>
        <div className="flex items-center gap-1.5">
          {material.isPremium ? (
            <Badge tone="warning"><Lock size={10} /> Premium</Badge>
          ) : (
            <Badge tone="success">Free</Badge>
          )}
        </div>
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-strong">
        {material.title}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-muted">{material.description || `${material.exam} study notes`}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-ink-muted">
        <span className="truncate">{material.exam}{material.subject ? ` · ${material.subject}` : ''}</span>
        <span className="inline-flex shrink-0 items-center gap-1"><Download size={11} />{formatNumber(material.downloadCount)}</span>
      </div>
    </button>
  );
}

export function TestCard({ test }: { test: Test }) {
  return (
    <Link to={`/tests/${test.id}`} className="card card-hover group flex h-full flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="brand">{testTypeLabel(test.type)}</Badge>
          <Badge>{test.exam}</Badge>
        </div>
        {test.courseId && <Lock size={13} className="mt-1 shrink-0 text-ink-muted" />}
      </div>
      <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-strong">{test.title}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{test.description}</p>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-2 px-3 py-2.5 text-center">
        <div>
          <p className="text-sm font-bold text-ink">{test.questionCount}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink-muted">Questions</p>
        </div>
        <div className="border-x border-line">
          <p className="text-sm font-bold text-ink">{test.durationMinutes}m</p>
          <p className="text-[10px] uppercase tracking-wide text-ink-muted">Duration</p>
        </div>
        <div>
          <p className="text-sm font-bold text-ink">{test.totalMarks}</p>
          <p className="text-[10px] uppercase tracking-wide text-ink-muted">Marks</p>
        </div>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1"><Users size={11} />{test.attemptCount} attempts</span>
        <span className="inline-flex items-center gap-1 font-semibold text-brand-strong">View test <ArrowRight size={11} /></span>
      </div>
    </Link>
  );
}

export function LiveClassCard({ session, compact = false }: { session: LiveClass; compact?: boolean }) {
  const live = session.status === 'live';
  return (
    <div className="card flex flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" /> LIVE NOW
            </span>
          ) : session.status === 'completed' ? (
            <Badge tone="neutral">Completed</Badge>
          ) : (
            <Badge tone="info"><CalendarDays size={10} /> {countdown(session.scheduledStart)}</Badge>
          )}
        </div>
        {session.attendeeCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-muted"><Users size={11} />{session.attendeeCount}</span>
        )}
      </div>
      <h3 className={cn('mt-3 line-clamp-2 font-semibold leading-snug text-ink', compact ? 'text-sm' : 'text-[15px]')}>{session.title}</h3>
      <p className="mt-1 truncate text-xs text-ink-muted">{session.courseTitle || 'Open session'}</p>
      <div className="mt-3 flex items-center gap-2">
        <Avatar name={session.teacher.name} color={session.teacher.avatarColor} size={22} />
        <span className="truncate text-xs font-medium text-ink-soft">{session.teacher.name}</span>
      </div>
      <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1"><Clock3 size={11} />{formatDate(session.scheduledStart)} · {formatTime(session.scheduledStart)}</span>
        <Link to="/live-classes" className="inline-flex items-center gap-1 font-semibold text-brand-strong">
          {live ? 'Join' : 'Details'} <ArrowRight size={11} />
        </Link>
      </div>
    </div>
  );
}

export function ResultRow({
  title,
  exam,
  score,
  maxMarks,
  accuracy,
  rank,
  percentile,
  date,
  link,
}: {
  title: string;
  exam: string;
  score: number;
  maxMarks: number;
  accuracy: number;
  rank: number | null;
  percentile: number | null;
  date: string;
  link?: string;
}) {
  const percent = maxMarks ? Math.round((score / maxMarks) * 1000) / 10 : 0;
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-emerald-600 dark:bg-success/10 dark:text-emerald-300">
        <Trophy size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
        <p className="text-[11px] text-ink-muted">{exam} · {formatDate(date)}</p>
      </div>
      <div className="flex items-center gap-4 text-right text-xs">
        <div>
          <p className="font-bold text-ink">{score}/{maxMarks}</p>
          <p className="text-[10px] text-ink-muted">{percent}%</p>
        </div>
        <div className="hidden sm:block">
          <p className="font-bold text-ink">{accuracy}%</p>
          <p className="text-[10px] text-ink-muted">Accuracy</p>
        </div>
        <div>
          <p className="font-bold text-ink">{rank ? `#${rank}` : '—'}</p>
          <p className="text-[10px] text-ink-muted">{percentile !== null ? `${percentile} %ile` : 'Rank'}</p>
        </div>
        {link && (
          <Link to={link} className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[11px] font-semibold text-ink-soft hover:border-brand hover:text-brand-strong">
            View <ArrowRight size={11} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function DurationPill({ seconds }: { seconds: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-navy/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
      <Timer size={10} /> {formatDuration(seconds)}
    </span>
  );
}

export function LectureStatus({ completed }: { completed: boolean }) {
  return completed ? (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
    </span>
  ) : (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line-strong text-ink-muted">
      <Layers size={10} />
    </span>
  );
}

export function LiveBadge({ status }: { status: string }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300">
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" /> LIVE
      </span>
    );
  }
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-ink-muted"><Radio size={11} />{status}</span>;
}
