import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, FileText, Lock, ShieldCheck, Sparkles, Terminal } from 'lucide-react';
import { api } from '../../lib/api';
import type { IntegrationStatus } from '../../lib/types';
import { Alert, Badge, LinkButton, SectionHeading } from '../../components/ui';

export function AiTutorPage() {
  const { data } = useQuery({
    queryKey: ['platform-config'],
    queryFn: () => api.get<IntegrationStatus>('/content/config'),
    staleTime: 300_000,
  });

  const enabled = Boolean(data?.integrations?.llm);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="EduPulse AI"
        title="AI Tutor"
        description="A study companion that answers from your course context — only when a real language model is connected through the backend."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="card flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300">
            <Bot size={30} />
          </span>
          <h2 className="mt-5 font-display text-xl font-bold text-ink">
            {enabled ? 'AI tutor credentials detected' : 'AI tutor is not enabled on this deployment'}
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            {enabled
              ? 'An LLM endpoint is configured on the server. The conversational tutor interface ships with the next module; until it is deployed, use lectures, materials and tests to study.'
              : data?.notes?.ai || 'The AI tutor requires an OpenAI-compatible API key configured on the server. This workspace will not show canned chatbot answers in place of a real model.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <LinkButton to="/materials" variant="secondary" icon={<FileText size={14} />}>Study materials</LinkButton>
            <LinkButton to="/tests" variant="outline" icon={<Sparkles size={14} />}>Practice a test</LinkButton>
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-[11px] text-ink-muted">
            <Lock size={11} /> API keys stay in the server environment. Nothing is exposed to the browser.
          </p>
        </section>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink"><Terminal size={15} className="text-brand" /> Module status</p>
              <Badge tone={enabled ? 'success' : 'warning'}>{enabled ? 'LLM configured' : 'Not configured'}</Badge>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-muted">
              <li>Requests will be proxied through the backend — the model key never reaches the client.</li>
              <li>Conversations will be scoped to your enrolled courses to keep answers grounded.</li>
              <li>Usage limits and moderation hooks are enforced server-side.</li>
              <li>No canned responses or simulated typing: if the LLM is unavailable, the tutor says so.</li>
            </ul>
          </div>

          <Alert tone="info" title="Why this page is empty">
            Shipping a demo chatbot with hardcoded replies would misrepresent the product. This page reflects the real integration state reported by the server.
          </Alert>

          <div className="card p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink"><ShieldCheck size={15} className="text-success" /> Study without AI</p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">Every core learning loop works today: lectures with resume, downloadable materials, timed tests, solutions and analytics.</p>
            <Link to="/dashboard/learning" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-strong">
              Go to My Learning <ArrowRight size={12} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
