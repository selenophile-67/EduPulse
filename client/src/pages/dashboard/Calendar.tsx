import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, FileText, Radio } from 'lucide-react';
import { api, errorMessage, queryString } from '../../lib/api';
import type { CalendarData } from '../../lib/types';
import { Badge, Button, EmptyState, ErrorState, PageLoader, SectionHeading, Tabs } from '../../components/ui';
import { formatTime } from '../../lib/format';
import { cn } from '../../lib/cn';

type View = 'day' | 'week' | 'month';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function mondayOf(date: Date) {
  const day = startOfDay(date);
  return addDays(day, -((day.getDay() + 6) % 7));
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function CalendarPage() {
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));

  const range = useMemo(() => {
    if (view === 'month') {
      const from = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
      const to = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
      return { from, to, query: queryString({ month: monthKey(anchor) }) };
    }
    if (view === 'week') {
      const from = mondayOf(anchor);
      const to = addDays(from, 6);
      to.setHours(23, 59, 59, 999);
      return { from, to, query: queryString({ from: from.toISOString(), to: to.toISOString() }) };
    }
    const from = startOfDay(anchor);
    const to = new Date(from);
    to.setHours(23, 59, 59, 999);
    return { from, to, query: queryString({ from: from.toISOString(), to: to.toISOString() }) };
  }, [anchor, view]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['learning-calendar', view, dayKey(anchor)],
    queryFn: () => api.get<CalendarData>(`/learning/calendar${range.query}`),
  });

  const events = useMemo(() => {
    if (!data) return [];
    return [
      ...data.liveClasses.map((session) => ({
        key: `live-${session.id}`,
        kind: 'live' as const,
        at: session.scheduledStart,
        end: session.scheduledEnd,
        title: session.title,
        subtitle: session.courseTitle || 'Open session',
        href: '/live-classes',
      })),
      ...data.tests.map((test) => ({
        key: `test-${test.id}`,
        kind: 'test' as const,
        at: test.scheduledAt,
        end: null,
        title: test.title,
        subtitle: `${test.exam} · ${test.durationMinutes} min · ${test.totalMarks} marks`,
        href: `/tests/${test.id}`,
      })),
    ].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const event of events) {
      const key = dayKey(new Date(event.at));
      map.set(key, [...(map.get(key) || []), event]);
    }
    return map;
  }, [events]);

  const shift = (direction: number) => {
    if (view === 'month') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + direction, 1));
    else if (view === 'week') setAnchor(addDays(anchor, direction * 7));
    else setAnchor(addDays(anchor, direction));
  };

  const title = view === 'month'
    ? anchor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : view === 'week'
      ? `${range.from.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${range.to.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
      : anchor.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const monthCells = useMemo(() => {
    if (view !== 'month') return [];
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = addDays(first, -offset);
    return Array.from({ length: 42 }, (_, index) => addDays(start, index));
  }, [anchor, view]);

  const EventPill = ({ event }: { event: (typeof events)[number] }) => (
    <Link to={event.href} className={cn(
      'block rounded-lg border px-2.5 py-1.5 text-[11px] transition',
      event.kind === 'live'
        ? 'border-blue-200/70 bg-blue-50 text-blue-800 hover:border-blue-400 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-200'
        : 'border-amber-200/70 bg-amber-50 text-amber-800 hover:border-amber-400 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200',
    )}>
      <span className="flex items-center gap-1 font-semibold">
        {event.kind === 'live' ? <Radio size={10} /> : <FileText size={10} />}
        {formatTime(event.at)}
      </span>
      <span className="mt-0.5 block truncate font-medium">{event.title}</span>
    </Link>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SectionHeading eyebrow="Schedule" title="Calendar" description="Live classes and tests from your enrolled courses." className="mb-0" />
        <Tabs
          value={view}
          onChange={setView}
          tabs={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]}
          className="shrink-0"
        />
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <Button variant="outline" size="sm" onClick={() => shift(-1)} icon={<ChevronLeft size={14} />} aria-label="Previous">
          Prev
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAnchor(startOfDay(new Date()))}>Today</Button>
        <Button variant="outline" size="sm" onClick={() => shift(1)}>
          Next <ChevronRight size={14} />
        </Button>
        <p className="ml-auto text-sm font-semibold text-ink">{title}</p>
      </div>

      {isLoading ? (
        <PageLoader label="Loading your schedule" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : view === 'month' ? (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-line bg-surface-2/60">
            {WEEKDAYS.map((day) => <div key={day} className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wide text-ink-muted">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {monthCells.map((date) => {
              const key = dayKey(date);
              const dayEvents = grouped.get(key) || [];
              const inMonth = date.getMonth() === anchor.getMonth();
              const isToday = key === dayKey(new Date());
              const isSelected = key === dayKey(anchor);
              return (
                <button
                  key={key}
                  onClick={() => { setAnchor(startOfDay(date)); setView('day'); }}
                  className={cn(
                    'min-h-[86px] border-b border-r border-line p-1.5 text-left align-top transition hover:bg-surface-2/60 sm:min-h-[104px]',
                    !inMonth && 'bg-surface-2/30 text-ink-muted',
                    isSelected && 'bg-brand-soft/60 dark:bg-brand/10',
                  )}
                >
                  <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold', isToday ? 'bg-navy text-white dark:bg-white dark:text-navy' : 'text-ink-soft')}>
                    {date.getDate()}
                  </span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span key={event.key} className={cn(
                        'block truncate rounded px-1 py-0.5 text-[9px] font-medium',
                        event.kind === 'live' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
                      )}>
                        {formatTime(event.at)} {event.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && <span className="block text-[9px] font-semibold text-ink-muted">+{dayEvents.length - 2} more</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={cn('grid gap-4', view === 'week' ? 'md:grid-cols-7' : '')}>
          {(view === 'week' ? Array.from({ length: 7 }, (_, index) => addDays(range.from, index)) : [anchor]).map((date) => {
            const key = dayKey(date);
            const dayEvents = grouped.get(key) || [];
            const isToday = key === dayKey(new Date());
            return (
              <div key={key} className={cn('card p-3', view === 'day' && 'p-5')}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                      {date.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </p>
                    <p className={cn('text-lg font-bold', isToday ? 'text-brand-strong' : 'text-ink')}>{date.getDate()}</p>
                  </div>
                  {isToday && <Badge tone="brand">Today</Badge>}
                </div>
                <div className={cn('mt-2 space-y-2', view === 'day' && 'mt-4 space-y-3')}>
                  {dayEvents.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-line px-2 py-3 text-center text-[10px] text-ink-muted">No events</p>
                  ) : view === 'day' ? (
                    dayEvents.map((event) => (
                      <Link key={event.key} to={event.href} className={cn(
                        'flex items-start gap-3 rounded-xl border p-3 transition',
                        event.kind === 'live' ? 'border-blue-200 hover:border-blue-400 dark:border-blue-500/20' : 'border-amber-200 hover:border-amber-400 dark:border-amber-500/20',
                      )}>
                        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', event.kind === 'live' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300')}>
                          {event.kind === 'live' ? <Radio size={16} /> : <FileText size={16} />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink">{event.title}</p>
                          <p className="mt-0.5 text-[11px] text-ink-muted">{event.subtitle}</p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-ink-soft">
                            <Clock3 size={11} /> {formatTime(event.at)}
                            {event.end ? ` – ${formatTime(event.end)}` : ''}
                          </p>
                        </div>
                        <ArrowRight size={14} className="mt-2 shrink-0 text-ink-muted" />
                      </Link>
                    ))
                  ) : (
                    dayEvents.map((event) => <EventPill key={event.key} event={event} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {events.length === 0 && view !== 'month' && (
        <EmptyState
          icon={<CalendarDays size={22} />}
          title="Nothing scheduled in this range"
          description="Live classes and timed tests from your enrolled courses will appear here automatically."
          action={<Link to="/courses" className="text-sm font-semibold text-brand-strong">Browse courses <ArrowRight size={13} className="inline" /></Link>}
        />
      )}

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface px-4 py-3 text-[11px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> Live class</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Test window</span>
        <span className="ml-auto inline-flex items-center gap-1"><Clock3 size={11} /> Times shown in your local timezone</span>
      </div>
    </div>
  );
}
