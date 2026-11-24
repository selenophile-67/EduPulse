import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Database, HardDrive, Mail, Radio, RefreshCw, Server, Sparkles } from 'lucide-react';
import { api, ApiError, errorMessage } from '../../lib/api';
import type { AdminHealth, IntegrationStatus } from '../../lib/types';
import { Alert, Badge, Button, ErrorState, PageLoader, StatCard } from '../../components/ui';
import { formatNumber } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

const INTEGRATIONS = [
  { key: 'razorpay', noteKey: 'payments', label: 'Razorpay payments', icon: CreditCard, description: 'Paid course checkout and server-side payment verification.' },
  { key: 'livekit', noteKey: 'liveStreaming', label: 'LiveKit streaming', icon: Radio, description: 'In-platform live class streaming with tokens issued by the API.' },
  { key: 'llm', noteKey: 'ai', label: 'AI tutor (LLM)', icon: Sparkles, description: 'The EduPulse AI Tutor proxied through a secured backend endpoint.' },
  { key: 'smtp', noteKey: 'email', label: 'Email (SMTP)', icon: Mail, description: 'Transactional email such as password resets and notifications.' },
  { key: 's3', noteKey: null, label: 'Object storage (S3)', icon: HardDrive, description: 'Durable media storage for lecture videos and study material PDFs.' },
] as const;

export function AdminIntegrationsPage() {
  const toast = useToast();
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<string | null>(null);

  const health = useQuery({
    queryKey: ['admin-health'],
    queryFn: () => api.get<AdminHealth>('/admin/health'),
  });
  const config = useQuery({
    queryKey: ['content-config'],
    queryFn: () => api.get<IntegrationStatus>('/content/config'),
  });

  const refresh = () => {
    health.refetch();
    config.refetch();
  };

  const probeCheckout = async () => {
    setProbing(true);
    setProbeResult(null);
    try {
      await api.post('/admin/payments/checkout', {});
      setProbeResult('Unexpected: the checkout endpoint returned success. Paid access must only be granted after server-side verification — inspect the API before enabling payments.');
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 503) {
        setProbeResult(`Endpoint responded ${cause.status} ${cause.code}: ${cause.message}`);
      } else {
        setProbeResult(errorMessage(cause));
        toast.error('Checkout probe failed', errorMessage(cause));
      }
    } finally {
      setProbing(false);
    }
  };

  const loading = health.isLoading || config.isLoading;
  const error = health.error || config.error;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Integrations & system</h1>
          <p className="mt-1 text-sm text-ink-muted">Everything below is read from server environment configuration. Capabilities switch on only when real credentials are present.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} icon={<RefreshCw size={14} />} loading={health.isFetching || config.isFetching}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <PageLoader label="Reading system status" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={refresh} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Environment" value={health.data?.environment ?? '—'} icon={<Server size={18} />} hint={`Node ${health.data?.nodeVersion}`} />
            <StatCard label="Uptime" value={`${Math.floor((health.data?.uptimeSeconds ?? 0) / 3600)}h`} icon={<Server size={18} />} hint={`${health.data?.memoryUsedMb ?? 0} MB resident memory`} />
            <StatCard label="Database" value={`${health.data?.dbSizeMb ?? 0} MB`} icon={<Database size={18} />} hint={`${formatNumber(health.data?.counts.users ?? 0)} users · ${formatNumber(health.data?.counts.courses ?? 0)} courses`} tone="info" />
            <StatCard label="Media storage" value={health.data?.storage ?? '—'} icon={<HardDrive size={18} />} hint="Local disk uploads are served through the API." tone="violet" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {INTEGRATIONS.map(({ key, noteKey, label, icon: Icon, description }) => {
              const configured = Boolean(health.data?.integrations?.[key]);
              return (
                <article key={key} className="card flex items-start gap-4 p-5">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${configured ? 'bg-success-soft text-emerald-600 dark:bg-success/10 dark:text-emerald-300' : 'bg-surface-2 text-ink-muted'}`}>
                    <Icon size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-semibold text-ink">{label}</h2>
                      <Badge tone={configured ? 'success' : 'neutral'}>{configured ? 'Configured' : 'Not configured'}</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{description}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">{(noteKey && config.data?.notes?.[noteKey]) ?? 'Uploads are written to the server disk and served through authenticated API routes.'}</p>
                  </div>
                </article>
              );
            })}
          </div>

          <Alert tone="warning" title="Payments are honest by design">
            <p>
              Checkout is disabled unless Razorpay credentials are present, and even with credentials this build never grants access from a frontend success callback.
              Enrollment only activates after the API verifies the payment signature server-side.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" onClick={probeCheckout} loading={probing} icon={<CreditCard size={14} />}>
                Probe checkout endpoint
              </Button>
              {probeResult && <span className="text-[11px] text-ink-soft">{probeResult}</span>}
            </div>
          </Alert>

          {config.data && (
            <div className="card space-y-3 p-5">
              <h2 className="text-sm font-semibold text-ink">Configuration notes</h2>
              <dl className="grid gap-3 text-xs sm:grid-cols-2">
                <div><dt className="font-semibold uppercase tracking-wide text-ink-muted">Payments</dt><dd className="mt-1 text-ink-soft">{config.data.notes.payments}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-ink-muted">Live streaming</dt><dd className="mt-1 text-ink-soft">{config.data.notes.liveStreaming}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-ink-muted">Email</dt><dd className="mt-1 text-ink-soft">{config.data.notes.email}</dd></div>
                <div><dt className="font-semibold uppercase tracking-wide text-ink-muted">AI tutor</dt><dd className="mt-1 text-ink-soft">{config.data.notes.ai}</dd></div>
              </dl>
              <p className="text-[11px] text-ink-muted">Add credentials to the server environment file and restart the API to enable a capability. Secrets are never exposed to the browser — only these booleans are.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
