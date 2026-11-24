import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, BookOpen, ChevronDown, Cpu, HeartHandshake, Lock, ShieldCheck, Sparkles, Target, Users,
} from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import type { HomeContent, IntegrationStatus } from '../lib/types';
import { Alert, ErrorState, LinkButton, PageLoader, SectionHeading } from '../components/ui';
import { formatCompact } from '../lib/format';
import { cn } from '../lib/cn';

const INTEGRATION_LABELS: Record<string, string> = {
  razorpay: 'Razorpay payments',
  livekit: 'LiveKit streaming',
  llm: 'AI tutor (LLM)',
  smtp: 'Email (SMTP)',
  s3: 'Object storage',
};

const PILLARS = [
  { icon: BookOpen, title: 'Structured learning', body: 'Courses combine recorded lectures, study notes and live doubt sessions into one sequence, so nothing depends on guesswork.' },
  { icon: Target, title: 'Practice that measures', body: 'Timed tests are scored on the server with declared negative marking. Rank appears only when a genuine cohort exists.' },
  { icon: ShieldCheck, title: 'Honest by default', body: 'If a payment gateway, streaming provider or AI model is not configured, the product says so instead of faking success.' },
  { icon: HeartHandshake, title: 'Mentorship at scale', body: 'Educators monitor student accuracy, attendance and progress from a workspace built for teaching, not vanity metrics.' },
];

export function AboutPage() {
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['content-home'],
    queryFn: () => api.get<HomeContent>('/content/home'),
    staleTime: 60_000,
  });
  const { data: config } = useQuery({
    queryKey: ['platform-config'],
    queryFn: () => api.get<IntegrationStatus>('/content/config'),
    staleTime: 300_000,
  });

  if (isLoading) return <div className="container-x"><PageLoader label="Loading about EduPulse" /></div>;
  if (error || !data) return <div className="container-x py-16"><ErrorState message={errorMessage(error)} onRetry={() => refetch()} /></div>;

  return (
    <div className="bg-page">
      <section className="relative overflow-hidden border-b border-line bg-navy text-white">
        <div className="bg-grid absolute inset-0 opacity-[0.12]" />
        <div className="container-x relative py-14 lg:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80">
            <Sparkles size={12} /> About EduPulse
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            An exam-prep platform built on evidence, not theatre.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
            EduPulse brings courses, educators, tests and analytics into one workspace. Every number you see is computed from something that actually happened on the platform.
          </p>
          <div className="mt-8 grid max-w-2xl grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-4">
            {[
              { label: 'Students', value: formatCompact(data.stats.students) },
              { label: 'Courses', value: data.stats.courses },
              { label: 'Recorded lectures', value: data.stats.lectures },
              { label: 'Practice questions', value: formatCompact(data.stats.questions) },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-extrabold">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-white/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container-x py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            <section>
              <SectionHeading eyebrow="Why we exist" title="Preparation should feel like progress, not noise" description="Most platforms optimise for sign-ups. We optimise for the moment a student can see exactly what to study next." />
              <div className="grid gap-4 sm:grid-cols-2">
                {PILLARS.map((pillar) => (
                  <div key={pillar.title} className="card p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300">
                      <pillar.icon size={19} />
                    </span>
                    <h3 className="mt-3 text-base font-semibold text-ink">{pillar.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{pillar.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionHeading eyebrow="How the product works" title="Four connected layers" />
              <ol className="relative space-y-4 border-l border-line pl-6">
                {[
                  { title: 'Discover and enrol', body: 'Filter the catalogue by exam, subject, level, language and price. Free courses enrol instantly; paid checkout stays disabled until a gateway is verified server-side.' },
                  { title: 'Learn with structure', body: 'Stream recorded lectures with resume support, download permitted materials, and follow the live class schedule for your course.' },
                  { title: 'Practise honestly', body: 'Attempt timed tests with autosave and auto-submit. Solutions unlock after submission, and rank is computed among real submissions.' },
                  { title: 'Improve with evidence', body: 'Subject and chapter breakdowns show accuracy, unattempted questions and score contribution so the next study block is obvious.' },
                ].map((step, index) => (
                  <li key={step.title} className="relative">
                    <span className="absolute -left-[35px] flex h-6 w-6 items-center justify-center rounded-full bg-navy text-[10px] font-bold text-white dark:bg-white dark:text-navy">{index + 1}</span>
                    <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <SectionHeading eyebrow="FAQ" title="Questions students ask" />
              <div className="card divide-y divide-line overflow-hidden">
                {data.faqs.map((faq) => (
                  <div key={faq.id}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-surface-2/60"
                      aria-expanded={openFaq === faq.id}
                    >
                      <span className="text-sm font-semibold text-ink">{faq.question}</span>
                      <ChevronDown size={16} className={cn('shrink-0 text-ink-muted transition-transform', openFaq === faq.id && 'rotate-180')} />
                    </button>
                    {openFaq === faq.id && (
                      <p className="px-5 pb-4 text-sm leading-relaxed text-ink-muted">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-muted">
                More questions? <Link to="/contact" className="font-semibold text-brand-strong">Contact the team</Link>.
              </p>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Lock size={15} className="text-brand" /> Deployment transparency</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
                Integrations are reported from the running server, not from marketing copy. This build currently reports:
              </p>
              <div className="mt-3 space-y-2">
                {config && Object.entries(config.integrations).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-xs">
                    <span className="text-ink-soft">{INTEGRATION_LABELS[key] || key}</span>
                    <span className={cn('inline-flex items-center gap-1 font-semibold', value ? 'text-emerald-600 dark:text-emerald-300' : 'text-ink-muted')}>
                      <span className={cn('h-1.5 w-1.5 rounded-full', value ? 'bg-success' : 'bg-line-strong')} />
                      {value ? 'Configured' : 'Not configured'}
                    </span>
                  </div>
                ))}
              </div>
              {config?.notes?.ai && <Alert tone="info" className="mt-3 text-xs">{config.notes.ai}</Alert>}
            </div>

            <div className="card p-5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Users size={15} className="text-info" /> Who it serves</p>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-muted">
                <li><span className="font-semibold text-ink-soft">Students</span> learn, practise and track progress.</li>
                <li><span className="font-semibold text-ink-soft">Educators</span> publish courses, tests, materials and live schedules.</li>
                <li><span className="font-semibold text-ink-soft">Administrators</span> approve educators, audit payments and monitor integrations.</li>
              </ul>
            </div>

            <div className="card bg-navy p-5 text-white">
              <p className="flex items-center gap-2 text-sm font-semibold"><Cpu size={15} className="text-brand" /> Built for Stage 1</p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                Free courses, recorded lectures, tests, analytics, live schedules and role workspaces are fully functional. Payment capture and AI tutoring activate only when their providers are configured.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <LinkButton to="/courses" size="sm" variant="white">Explore courses</LinkButton>
                <Link to="/contact" className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:border-brand hover:text-white">
                  Contact <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
