import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, BellRing, BookOpen, CalendarDays, CheckCircle2, ChevronDown,
  Clock3, Download, FileText, GraduationCap, PlayCircle, Radio, Search, Smartphone, Sparkles, Star, Trophy,
  Users, Video, Zap, Quote,
} from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import type { HomeContent } from '../lib/types';
import { Avatar, Badge, Button, ErrorState, LinkButton, Progress, RatingStars, SectionHeading, Skeleton } from '../components/ui';
import { CourseCard, CategoryIcon } from '../components/cards';
import { courseTheme, CATEGORY_META } from '../lib/theme';
import { countdown, formatCompact, formatDate, formatDuration, formatNumber, formatTime } from '../lib/format';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function Hero({ data }: { data: HomeContent }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const liveNow = data.upcomingLive.find((session) => session.status === 'live');
  const nextLive = data.upcomingLive.find((session) => session.status !== 'live');
  const topAchiever = data.achievements[0];

  const search = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/courses${term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ''}`);
  };

  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <div className="bg-grid absolute inset-0 opacity-[0.14]" />
      <div className="absolute -right-32 top-0 h-[420px] w-[420px] rounded-full bg-brand/25 blur-3xl" />
      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="container-x relative grid gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-20">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80 backdrop-blur">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-success/20 text-success"><Sparkles size={10} /></span>
            {formatNumber(data.stats.questions)}+ questions · {formatNumber(data.stats.lectures)} recorded lectures
          </div>
          <h1 className="mt-5 max-w-2xl font-display text-[2.5rem] font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            Your Journey to <span className="text-gradient">Success</span> Starts Here.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/65 sm:text-base">
            Structured courses, live doubt sessions, recorded lectures and mock tests that report your real rank — built for JEE, NEET, UPSC, SSC, Banking, GATE, CUET and school exams.
          </p>

          <form onSubmit={search} className="mt-7 flex max-w-xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="What do you want to learn today?"
                className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pl-10 pr-3 text-sm text-white outline-none backdrop-blur placeholder:text-white/45 focus:border-brand focus:ring-4 focus:ring-brand/20"
                aria-label="Search courses"
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0">Explore courses</Button>
          </form>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/50">
            <span>Trending:</span>
            {['JEE Main', 'NEET UG', 'UPSC CSE', 'GATE CSE'].map((exam) => (
              <Link key={exam} to={`/courses?exam=${encodeURIComponent(exam)}`} className="rounded-full border border-white/10 px-2.5 py-1 text-white/70 transition hover:border-brand hover:text-white">
                {exam}
              </Link>
            ))}
            <Link to="/register" className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-semibold text-white transition hover:bg-brand">
              Start learning free <ArrowRight size={11} />
            </Link>
          </div>

          <dl className="mt-9 grid max-w-xl grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
            {[
              { label: 'Students', value: formatCompact(data.stats.students), icon: Users },
              { label: 'Courses', value: data.stats.courses, icon: BookOpen },
              { label: 'Mock tests', value: data.stats.tests, icon: FileText },
              { label: 'Avg rating', value: data.stats.avgRating ? `${data.stats.avgRating}/5` : 'New', icon: Star },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-white/45"><stat.icon size={10} />{stat.label}</dt>
                <dd className="mt-1 font-display text-xl font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative hidden lg:block">
          <div className="animate-float rounded-2xl border border-white/10 bg-white/[0.07] p-4 shadow-2xl backdrop-blur-xl">
            {liveNow ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" /> LIVE NOW
                  </span>
                  <span className="text-[10px] text-white/50">{liveNow.attendeeCount} watching</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug">{liveNow.title}</h3>
                <p className="mt-1 text-[11px] text-white/50">{liveNow.courseTitle}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Avatar name={liveNow.teacher.name} color={liveNow.teacher.avatarColor} size={26} />
                  <span className="text-xs text-white/70">{liveNow.teacher.name}</span>
                  <Link to="/live-classes" className="ml-auto inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold">
                    Join class <ArrowRight size={11} />
                  </Link>
                </div>
              </>
            ) : nextLive ? (
              <>
                <div className="flex items-center justify-between">
                  <Badge tone="brand" className="border-white/10 bg-white/10 text-white"><CalendarDays size={10} />{countdown(nextLive.scheduledStart)}</Badge>
                  <span className="text-[10px] text-white/50">Upcoming live</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-bold leading-snug">{nextLive.title}</h3>
                <p className="mt-1 text-[11px] text-white/50">{nextLive.courseTitle} · {formatDate(nextLive.scheduledStart)}, {formatTime(nextLive.scheduledStart)}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Avatar name={nextLive.teacher.name} color={nextLive.teacher.avatarColor} size={26} />
                  <span className="text-xs text-white/70">{nextLive.teacher.name}</span>
                  <Link to="/live-classes" className="ml-auto text-[11px] font-semibold text-brand">Set reminder</Link>
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-white/45"><BarChart3 size={11} /> Latest top score</div>
            {topAchiever ? (
              <div className="mt-3 flex items-center gap-3">
                <Avatar name={topAchiever.studentName} color={topAchiever.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{topAchiever.studentName}</p>
                  <p className="truncate text-[11px] text-white/50">{topAchiever.testTitle}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold text-success">{topAchiever.percent}%</p>
                  <p className="text-[10px] text-white/40">{topAchiever.exam}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-white/50">Attempt a mock test to appear here.</p>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur">
              <p className="font-display text-2xl font-bold">{data.stats.courses}</p>
              <p className="mt-0.5 text-[10px] text-white/45">Structured courses</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur">
              <p className="font-display text-2xl font-bold">{data.stats.materials}+</p>
              <p className="mt-0.5 text-[10px] text-white/45">Downloadable notes</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BannerStrip({ banner }: { banner: HomeContent['banners'][number] }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="container-x flex flex-col items-start justify-between gap-2 py-3 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-xs text-ink-soft">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-soft text-brand-strong dark:bg-brand/10"><BellRing size={12} /></span>
          <span><strong className="font-semibold text-ink">{banner.title}.</strong> {banner.subtitle}</span>
        </p>
        {banner.ctaLink && banner.ctaLabel && (
          <Link to={banner.ctaLink} className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-brand-strong hover:underline">
            {banner.ctaLabel} <ArrowRight size={12} />
          </Link>
        )}
      </div>
    </div>
  );
}

function CategoriesSection({ content }: { content: HomeContent }) {
  return (
    <section className="container-x py-14">
      <SectionHeading
        eyebrow="Find your path"
        title="Pick your exam. We will build the roadmap."
        description="Nine dedicated tracks with curated lectures, notes and tests — each mapped to its exam pattern."
        action={<LinkButton to="/courses" variant="secondary" size="sm">All categories <ArrowRight size={13} /></LinkButton>}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {content.categories.map((category) => {
          const meta = CATEGORY_META[category.slug];
          return (
            <Link
              key={category.slug}
              to={`/courses?category=${category.slug}`}
              className="card card-hover group relative overflow-hidden p-4"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-105"
                style={{ background: `${meta?.accent || '#f97316'}16`, color: meta?.accent || '#f97316' }}
              >
                <CategoryIcon slug={category.slug} size={21} />
              </span>
              <p className="mt-3 text-sm font-bold text-ink">{category.name}</p>
              <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">{category.tagline}</p>
              <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-ink-muted">{category.courseCount} courses</p>
              <ArrowUpRight size={14} className="absolute right-4 top-4 text-ink-muted opacity-0 transition group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PopularCourses({ content }: { content: HomeContent }) {
  return (
    <section className="bg-surface py-14">
      <div className="container-x">
        <SectionHeading
          eyebrow="Popular courses"
          title="Learner-approved courses"
          description="Ranked by ratings from students who actually completed lessons and tests."
          action={<LinkButton to="/courses?sort=rating" variant="secondary" size="sm">Browse all <ArrowRight size={13} /></LinkButton>}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {content.popular.map((course) => <CourseCard key={course.id} course={course} />)}
        </div>
      </div>
    </section>
  );
}

function Bestsellers({ content }: { content: HomeContent }) {
  return (
    <section className="container-x py-14">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.5fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="Bestselling batches"
            title="Batches students keep coming back to"
            description="High-enrolment programmes with complete syllabus coverage, structured batches, and mentor support."
            className="mb-0"
          />
          <div className="mt-6 space-y-3 rounded-2xl border border-line bg-surface p-4">
            <p className="flex items-center gap-2 text-xs font-semibold text-ink"><Zap size={14} className="text-brand" /> What is included</p>
            {['Recorded lectures with resume & completion tracking', 'Live doubt sessions and a study calendar', 'Chapter tests with negative marking and real ranks', 'Downloadable, exam-focused study notes'].map((item) => (
              <p key={item} className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-success" /> {item}
              </p>
            ))}
          </div>
          <LinkButton to="/courses?sort=popular" variant="navy" className="mt-5">Explore bestsellers <ArrowRight size={14} /></LinkButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {content.bestsellers.map((course, index) => {
            const theme = courseTheme(course.theme);
            return (
              <Link key={course.id} to={`/courses/${course.slug}`} className="card card-hover group flex flex-col overflow-hidden">
                <div className="relative h-28 p-4 text-white" style={{ background: theme.gradient }}>
                  <div className="bg-dots absolute inset-0 opacity-20" />
                  <span className="relative font-display text-4xl font-extrabold text-white/25">0{index + 1}</span>
                  <span className="absolute right-3 top-3 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold backdrop-blur">{course.exam}</span>
                  <h3 className="absolute bottom-3 left-4 right-4 line-clamp-1 font-display text-sm font-bold">{course.title}</h3>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-ink-muted">
                    <span className="inline-flex items-center gap-1"><Users size={11} />{formatCompact(course.enrolledCount)} enrolled</span>
                    <RatingStars value={course.rating.average} size={11} showValue={Boolean(course.rating.average)} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="text-xs text-ink-muted">{course.lectureCount} lectures · {formatDuration(course.totalDurationSeconds)}</span>
                    <span className="text-sm font-bold text-ink">{course.isFree ? <span className="text-success">Free</span> : `₹${course.priceCents / 100}`}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LiveSection({ content }: { content: HomeContent }) {
  return (
    <section className="bg-navy py-14 text-white">
      <div className="container-x">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand"><Radio size={13} /> Live classes</p>
            <h2 className="text-2xl font-bold sm:text-3xl">Scheduled sessions, starting soon</h2>
            <p className="mt-2 max-w-xl text-sm text-white/55">
              A class is marked LIVE only while it is actually in progress. Join links and attendance are handled by the platform.
            </p>
          </div>
          <LinkButton to="/live-classes" variant="outline" size="sm" className="border-white/25 text-white hover:bg-white/10 hover:border-white/40">
            Full schedule <ArrowRight size={13} />
          </LinkButton>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {content.upcomingLive.map((session) => (
            <div key={session.id} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur transition hover:border-white/25">
              <div className="flex items-center justify-between">
                {session.status === 'live' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[10px] font-bold text-emerald-300"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-success" /> LIVE NOW</span>
                ) : (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white/70">{countdown(session.scheduledStart)}</span>
                )}
                <span className="text-[10px] text-white/40">{formatTime(session.scheduledStart)}</span>
              </div>
              <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-snug">{session.title}</h3>
              <p className="mt-1 truncate text-[11px] text-white/45">{session.courseTitle || 'Open session'}</p>
              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                <Avatar name={session.teacher.name} color={session.teacher.avatarColor} size={24} />
                <span className="truncate text-[11px] text-white/65">{session.teacher.name}</span>
                <Link to="/live-classes" className="ml-auto rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-semibold hover:bg-brand">Details</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FreeResources({ content }: { content: HomeContent }) {
  return (
    <section className="container-x py-14">
      <SectionHeading
        eyebrow="Free resources"
        title="Notes you can download right now"
        description="No payment, no gatekeeping. Preview and download these study materials with a free account."
        action={<LinkButton to="/materials?premium=free" variant="secondary" size="sm">All free resources <ArrowRight size={13} /></LinkButton>}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.freeResources.map((material) => (
          <Link key={material.id} to={`/materials?highlight=${material.id}`} className="card card-hover group flex items-start gap-3.5 p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300">
              <FileText size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-strong">{material.title}</span>
              <span className="mt-1 flex items-center gap-2 text-[11px] text-ink-muted">
                <Download size={11} /> {material.downloadCount} downloads · {material.exam}
              </span>
            </span>
            <ArrowRight size={14} className="mt-1 shrink-0 text-ink-muted transition group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecentLectures({ content }: { content: HomeContent }) {
  return (
    <section className="bg-surface py-14">
      <div className="container-x">
        <SectionHeading
          eyebrow="Recently uploaded"
          title="Fresh lectures from the studio"
          description="New recordings are added every week across all exam tracks."
          action={<LinkButton to="/courses" variant="secondary" size="sm">Browse courses <ArrowRight size={13} /></LinkButton>}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {content.recentLectures.map((lecture) => {
            const theme = courseTheme(lecture.theme);
            return (
              <Link key={lecture.id} to={`/courses/${lecture.courseSlug}`} className="card card-hover group overflow-hidden">
                <div className="relative flex h-24 items-center justify-center text-white" style={{ background: theme.gradient }}>
                  <div className="bg-dots absolute inset-0 opacity-20" />
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur transition group-hover:scale-110">
                    <PlayCircle size={18} />
                  </span>
                  <span className="absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">{formatDuration(lecture.durationSeconds)}</span>
                  {lecture.isPreview && <span className="absolute left-2 top-2 rounded bg-success px-1.5 py-0.5 text-[9px] font-bold">PREVIEW</span>}
                </div>
                <div className="p-3">
                  <p className="line-clamp-2 min-h-9 text-xs font-semibold leading-snug text-ink">{lecture.title}</p>
                  <p className="mt-1.5 truncate text-[10px] text-ink-muted">{lecture.courseTitle}</p>
                  <p className="mt-2 text-[10px] font-medium text-ink-muted">{formatDate(lecture.createdAt)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Educators({ content }: { content: HomeContent }) {
  return (
    <section className="container-x py-14">
      <SectionHeading
        eyebrow="Top educators"
        title="Learn from specialists, not generalists"
        description="Every educator is vetted and maps their teaching to a specific exam pattern."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {content.topEducators.map((educator) => (
          <div key={educator.id} className="card p-4 text-center">
            <div className="mx-auto w-fit">
              <Avatar name={educator.name} color={educator.avatarColor} size={56} />
            </div>
            <p className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-ink">
              {educator.name} <BadgeCheck size={13} className="text-info" />
            </p>
            <p className="mt-1 line-clamp-2 min-h-8 text-[11px] leading-relaxed text-ink-muted">{educator.headline || educator.subjects || 'EduPulse educator'}</p>
            <div className="mt-3 flex items-center justify-center gap-3 border-t border-line pt-3 text-[10px] text-ink-muted">
              <span>{educator.courseCount} courses</span>
              <span>{formatCompact(educator.studentCount)} students</span>
            </div>
            {educator.ratingAvg && (
              <div className="mt-2 flex justify-center"><RatingStars value={educator.ratingAvg} size={11} showValue /></div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function Achievements({ content }: { content: HomeContent }) {
  return (
    <section className="container-x pb-14">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Real achievements</p>
              <h2 className="mt-0.5 text-lg font-bold text-ink">Latest top scores</h2>
            </div>
            <Trophy size={20} className="text-amber-400" />
          </div>
          <div className="divide-y divide-line">
            {content.achievements.map((item, index) => (
              <div key={`${item.studentName}-${item.date}`} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-center font-display text-xs font-bold text-ink-muted">{index + 1}</span>
                <Avatar name={item.studentName} color={item.avatarColor} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">{item.studentName}</p>
                  <p className="truncate text-[10px] text-ink-muted">{item.testTitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-success">{item.percent}%</p>
                  <p className="text-[10px] text-ink-muted">{item.rank ? `Rank ${item.rank}` : item.exam}</p>
                </div>
              </div>
            ))}
          </div>
          <Link to="/results" className="block border-t border-line bg-surface-2 px-5 py-3 text-center text-[11px] font-semibold text-ink-soft hover:text-ink">
            See all published results <ArrowRight size={11} className="ml-1 inline" />
          </Link>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3.5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand">Success stories</p>
              <h2 className="mt-0.5 text-lg font-bold text-ink">In their own words</h2>
            </div>
            <Quote size={20} className="text-brand" />
          </div>
          <div className="divide-y divide-line">
            {content.successStories.slice(0, 4).map((story) => (
              <div key={`${story.studentName}-${story.date}`} className="px-5 py-3">
                <RatingStars value={story.rating} size={11} />
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-soft">“{story.body}”</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-ink-muted">
                  <Avatar name={story.studentName} color={story.avatarColor} size={18} /> {story.studentName} · {story.exam}
                </p>
              </div>
            ))}
          </div>
          <Link to="/results" className="block border-t border-line bg-surface-2 px-5 py-3 text-center text-[11px] font-semibold text-ink-soft hover:text-ink">
            Read more stories <ArrowRight size={11} className="ml-1 inline" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ content }: { content: HomeContent }) {
  return (
    <section className="bg-surface py-14">
      <div className="container-x">
        <SectionHeading eyebrow="Testimonials" title="We let the reviews speak" description="Every testimonial below is a real review left by an enrolled student." align="center" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.testimonials.map((item, index) => (
            <div key={`${item.studentName}-${index}`} className="card p-5">
              <RatingStars value={item.rating} size={13} />
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">“{item.body}”</p>
              <div className="mt-4 flex items-center gap-2.5 border-t border-line pt-3.5">
                <Avatar name={item.studentName} color={item.avatarColor} size={30} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-ink">{item.studentName}</p>
                  <p className="truncate text-[10px] text-ink-muted">{item.courseTitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ({ content }: { content: HomeContent }) {
  const [openId, setOpenId] = useState<string | null>(content.faqs[0]?.id || null);
  return (
    <section className="container-x py-14" id="faqs">
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHeading eyebrow="FAQ" title="Questions, answered honestly" description="Still unsure? Send us a message and a human will reply." className="mb-4" />
          <LinkButton to="/contact" variant="secondary" size="sm">Ask a question <ArrowRight size={13} /></LinkButton>
        </div>
        <div className="space-y-2">
          {content.faqs.map((faq) => (
            <div key={faq.id} className="card overflow-hidden">
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left"
                aria-expanded={openId === faq.id}
              >
                <span className="text-sm font-semibold text-ink">{faq.question}</span>
                <ChevronDown size={16} className={`shrink-0 text-ink-muted transition ${openId === faq.id ? 'rotate-180' : ''}`} />
              </button>
              {openId === faq.id && <p className="border-t border-line px-4 py-3.5 text-xs leading-relaxed text-ink-muted">{faq.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MobileSection() {
  return (
    <section className="container-x pb-14">
      <div className="relative overflow-hidden rounded-3xl bg-navy px-6 py-10 text-white sm:px-10 lg:px-14">
        <div className="bg-grid absolute inset-0 opacity-10" />
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/20 blur-3xl" />
        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge tone="brand" className="border-white/15 bg-white/10 text-white"><Smartphone size={11} /> Learn anywhere</Badge>
            <h2 className="mt-4 font-display text-2xl font-bold sm:text-3xl">EduPulse travels with your timetable</h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
              The entire platform is a responsive web experience: lectures resume from the exact second you left, tests autosave, and your calendar follows you across devices.
            </p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {[
                { icon: PlayCircle, title: 'Resume playback', text: 'Continue any lecture instantly' },
                { icon: BarChart3, title: 'Live analytics', text: 'Real scores, ranks and accuracy' },
                { icon: CalendarDays, title: 'Smart calendar', text: 'Daily, weekly and monthly plans' },
                { icon: Clock3, title: 'Server-timed tests', text: 'Autosave and auto-submit' },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3">
                  <feature.icon size={16} className="mt-0.5 shrink-0 text-brand" />
                  <div>
                    <p className="text-xs font-semibold">{feature.title}</p>
                    <p className="mt-0.5 text-[10px] text-white/45">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <LinkButton to="/register" size="md">Create free account <ArrowRight size={14} /></LinkButton>
              <LinkButton to="/courses" variant="outline" size="md" className="border-white/25 text-white hover:border-white/40 hover:bg-white/10">Browse courses</LinkButton>
            </div>
            <p className="mt-3 text-[10px] text-white/35">Native mobile apps are not part of this release; the web app is fully responsive.</p>
          </div>
          <div className="mx-auto w-full max-w-[260px]">
            <div className="rounded-[2rem] border border-white/15 bg-white/[0.06] p-2.5 shadow-2xl backdrop-blur">
              <div className="rounded-[1.6rem] bg-navy-800 p-3">
                <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/20" />
                <div className="rounded-xl bg-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white"><GraduationCap size={15} /></span>
                    <div>
                      <p className="text-[10px] font-bold">My Learning</p>
                      <p className="text-[9px] text-white/40">3 active courses</p>
                    </div>
                  </div>
                  <Progress value={62} className="mt-3 bg-white/15" />
                  <p className="mt-1.5 text-[9px] text-white/40">62% of your weekly plan</p>
                </div>
                {['Rotational Motion — 12 min left', 'Thermodynamics quiz', 'Organic mechanisms live'].map((item, index) => (
                  <div key={item} className="mt-2 flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-md ${index === 2 ? 'bg-success/20 text-emerald-300' : 'bg-white/10 text-white/60'}`}>
                      {index === 2 ? <Radio size={11} /> : <Video size={11} />}
                    </span>
                    <span className="truncate text-[9px] text-white/65">{item}</span>
                  </div>
                ))}
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2">
                  <Avatar name="Aarav Sharma" color="#F97316" size={22} />
                  <div>
                    <p className="text-[9px] font-semibold">Aarav Sharma</p>
                    <p className="text-[8px] text-white/35">12-day streak</p>
                  </div>
                  <span className="ml-auto text-[9px] font-bold text-success">82% acc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<{ message: string }>('/content/newsletter', { email: email || user?.email || '' });
      toast.success('Subscribed', data.message);
      setEmail('');
    } catch (error) {
      toast.error('Could not subscribe', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container-x pb-14">
      <div className="card flex flex-col items-start justify-between gap-5 border-brand/20 bg-gradient-to-r from-brand-soft via-surface to-surface p-6 dark:from-brand/10 sm:flex-row sm:items-center sm:p-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Stay ahead</p>
          <h2 className="mt-1 text-xl font-bold text-ink sm:text-2xl">One study digest. Every Sunday.</h2>
          <p className="mt-1 text-sm text-ink-muted">High-yield notes, new mock tests and exam updates. No noise.</p>
        </div>
        <form onSubmit={submit} className="flex w-full max-w-md gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={user?.email || 'you@example.com'}
            className="field flex-1"
            aria-label="Email address"
          />
          <Button type="submit" loading={loading}>Subscribe</Button>
        </form>
      </div>
    </section>
  );
}

export function HomePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['content-home'],
    queryFn: () => api.get<HomeContent>('/content/home'),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div>
        <div className="bg-navy px-4 py-20">
          <div className="container-x space-y-4">
            <Skeleton className="h-6 w-52 bg-white/10" />
            <Skeleton className="h-14 w-full max-w-2xl bg-white/10" />
            <Skeleton className="h-12 w-full max-w-xl bg-white/10" />
          </div>
        </div>
        <div className="container-x grid gap-5 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card p-4"><Skeleton className="h-32 w-full" /><Skeleton className="mt-4 h-4 w-3/4" /></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-x py-16">
        <ErrorState message={errorMessage(error || 'Home content is unavailable.')} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <>
      <Hero data={data} />
      {data.banners[0] && <BannerStrip banner={data.banners[0]} />}
      <CategoriesSection content={data} />
      <PopularCourses content={data} />
      <Bestsellers content={data} />
      <LiveSection content={data} />
      <FreeResources content={data} />
      <RecentLectures content={data} />
      <Educators content={data} />
      <Achievements content={data} />
      <Testimonials content={data} />
      <FAQ content={data} />
      <MobileSection />
      <NewsletterSection />
    </>
  );
}
