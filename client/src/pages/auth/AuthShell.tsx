import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Zap } from 'lucide-react';

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-page">
      <aside className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-navy p-10 text-white lg:flex xl:p-14">
        <div className="bg-grid absolute inset-0 opacity-[0.13]" />
        <div className="absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-info/20 blur-3xl" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-brand backdrop-blur">
              <Zap size={21} className="fill-current" />
            </span>
            <span className="font-display text-xl font-extrabold">
              Edu<span className="text-brand">Pulse</span>
            </span>
          </Link>
          <p className="mt-16 max-w-md font-display text-3xl font-bold leading-tight xl:text-4xl">
            Learn with structure. Practise with proof. <span className="text-gradient">Achieve with confidence.</span>
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/65">
            One account unlocks recorded lectures, live sessions, mock tests with real analytics, curated notes and a study calendar.
          </p>
        </div>
        <div className="relative space-y-3">
          {[
            'Server-verified tests with negative marking and real ranks',
            'Resume any lecture exactly where you left it',
            'Honest dashboards powered by your actual activity',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 text-sm text-white/80">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-success" />
              {item}
            </div>
          ))}
          <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
            <div className="flex -space-x-2">
              {['#F97316', '#10B981', '#6366F1', '#EC4899'].map((color) => (
                <span key={color} className="h-8 w-8 rounded-full border-2 border-navy" style={{ background: color }} />
              ))}
            </div>
            <p className="text-xs text-white/60">Trusted by learners preparing for 9 major exam streams</p>
          </div>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink">
            <ArrowLeft size={14} /> Back to homepage
          </Link>
          <Link to="/" className="flex items-center gap-1.5 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-brand dark:bg-white">
              <Zap size={16} className="fill-current" />
            </span>
            <span className="font-display font-extrabold text-ink">Edu<span className="text-brand">Pulse</span></span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-8">
          <div className="w-full max-w-md">
            <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-ink-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 text-center text-xs text-ink-muted">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
