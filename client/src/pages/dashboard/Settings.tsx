import { useEffect, useState, type FormEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell, KeyRound, Laptop, MonitorSmartphone, Moon, ShieldCheck, Smartphone, Sun, Trash2,
} from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { SessionRow } from '../../lib/types';
import { Alert, Badge, Button, Field, Input, SectionHeading } from '../../components/ui';
import { useTheme, type ThemePreference } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../lib/format';
import { cn } from '../../lib/cn';

interface Prefs {
  inApp: boolean;
  email: boolean;
  push: boolean;
}

const THEMES: { value: ThemePreference; label: string; icon: typeof Sun; description: string }[] = [
  { value: 'light', label: 'Light', icon: Sun, description: 'Bright surfaces for daytime study' },
  { value: 'dark', label: 'Dark', icon: Moon, description: 'Low-light palette for late sessions' },
  { value: 'system', label: 'System', icon: MonitorSmartphone, description: 'Follow your device setting' },
];

export function SettingsPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { preference, setPreference } = useTheme();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [changing, setChanging] = useState(false);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [savingPrefs, setSavingPrefs] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const prefsQuery = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: () => api.get<{ prefs: Prefs; emailConfigured: boolean }>('/auth/notification-prefs'),
  });
  const sessionsQuery = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => api.get<{ sessions: SessionRow[] }>('/auth/sessions'),
  });

  useEffect(() => {
    if (prefsQuery.data) setPrefs(prefsQuery.data.prefs);
  }, [prefsQuery.data]);

  const savePrefs = async (key: keyof Prefs, value: boolean) => {
    if (!prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSavingPrefs(key);
    try {
      const result = await api.put<{ prefs: Prefs; notice: string | null }>('/auth/notification-prefs', next);
      setPrefs(result.prefs);
      if (result.notice) toast.info('Preference saved', result.notice);
      else toast.success('Notification preference saved');
    } catch (cause) {
      setPrefs(prefs);
      toast.error(errorMessage(cause));
    } finally {
      setSavingPrefs(null);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      toast.error('Passwords do not match', 'Re-enter the new password in both fields.');
      return;
    }
    setChanging(true);
    try {
      await api.patch('/auth/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password changed', 'Other sessions remain active until you sign them out.');
      queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setChanging(false);
    }
  };

  const revoke = async (session: SessionRow) => {
    setRevoking(session.id);
    try {
      await api.delete(`/auth/sessions/${session.id}`);
      toast.success('Session revoked');
      queryClient.invalidateQueries({ queryKey: ['auth-sessions'] });
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setRevoking(null);
    }
  };

  const sessionIcon = (userAgent: string | null) => {
    if (!userAgent) return Laptop;
    if (/mobile|android|iphone/i.test(userAgent)) return Smartphone;
    return Laptop;
  };

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Account" title="Settings" description="Password, notifications, appearance and active devices." />

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-ink"><KeyRound size={16} className="text-brand" /> Change password</p>
          <form onSubmit={changePassword} className="mt-4 space-y-4">
            <Field label="Current password" htmlFor="current-password">
              <Input id="current-password" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} required autoComplete="current-password" />
            </Field>
            <Field label="New password" htmlFor="new-password" hint="At least 8 characters, including a letter and a number.">
              <Input id="new-password" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} required minLength={8} autoComplete="new-password" />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm-password">
              <Input id="confirm-password" type="password" value={passwordForm.confirm} onChange={(event) => setPasswordForm({ ...passwordForm, confirm: event.target.value })} required autoComplete="new-password" />
            </Field>
            <Button type="submit" loading={changing}>Update password</Button>
          </form>
        </section>

        <section className="card p-5 sm:p-6">
          <p className="flex items-center gap-2 text-sm font-bold text-ink"><Sun size={16} className="text-brand" /> Appearance</p>
          <p className="mt-1 text-xs text-ink-muted">Theme preference is stored on this device.</p>
          <div className="mt-4 space-y-2">
            {THEMES.map((theme) => (
              <button
                key={theme.value}
                type="button"
                onClick={() => setPreference(theme.value)}
                className={cn('flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition', preference === theme.value ? 'border-brand bg-brand-soft/60 dark:bg-brand/10' : 'border-line hover:bg-surface-2')}
                aria-pressed={preference === theme.value}
              >
                <theme.icon size={17} className={preference === theme.value ? 'text-brand-strong' : 'text-ink-muted'} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink">{theme.label}</span>
                  <span className="block text-[11px] text-ink-muted">{theme.description}</span>
                </span>
                {preference === theme.value && <span className="h-2 w-2 rounded-full bg-brand" />}
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-ink"><Bell size={16} className="text-brand" /> Notifications</p>
          {prefsQuery.data && !prefsQuery.data.emailConfigured && <Badge tone="warning">Email delivery not configured</Badge>}
        </div>
        {prefsQuery.isLoading || !prefs ? (
          <p className="mt-3 text-xs text-ink-muted">Loading preferences…</p>
        ) : (
          <>
            <div className="mt-4 space-y-2">
              {([
                { key: 'inApp', label: 'In-app notifications', description: 'Bell updates for live classes, results and account activity.' },
                { key: 'email', label: 'Email notifications', description: prefsQuery.data?.emailConfigured ? 'Sent to your registered email address.' : 'Saved, but email delivery is not configured on this deployment.' },
                { key: 'push', label: 'Push notifications', description: 'Browser push is a Stage 2 integration; saving this preference is safe.' },
              ] as const).map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-4 rounded-xl border border-line px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="text-[11px] text-ink-muted">{item.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => savePrefs(item.key, !prefs[item.key])}
                    disabled={savingPrefs === item.key}
                    aria-pressed={prefs[item.key]}
                    aria-label={`Toggle ${item.label}`}
                    className={cn('relative h-6 w-11 shrink-0 rounded-full transition', prefs[item.key] ? 'bg-brand' : 'bg-surface-3')}
                  >
                    <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', prefs[item.key] ? 'left-[22px]' : 'left-0.5')} />
                  </button>
                </div>
              ))}
            </div>
            {!prefsQuery.data?.emailConfigured && (
              <Alert tone="info" className="mt-3">
                Email delivery is not configured. Password resets are handled by an administrator until SMTP credentials are added to the server environment.
              </Alert>
            )}
          </>
        )}
      </section>

      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-sm font-bold text-ink"><ShieldCheck size={16} className="text-brand" /> Active sessions</p>
          <span className="text-[11px] text-ink-muted">Sessions are revocable server-side.</span>
        </div>
        {sessionsQuery.isLoading ? (
          <p className="mt-3 text-xs text-ink-muted">Loading sessions…</p>
        ) : sessionsQuery.error ? (
          <p className="mt-3 text-xs text-danger">{errorMessage(sessionsQuery.error)}</p>
        ) : (
          <div className="mt-4 space-y-2">
            {(sessionsQuery.data?.sessions || []).map((session) => {
              const Icon = sessionIcon(session.userAgent);
              return (
                <div key={session.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line px-3.5 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-ink-muted"><Icon size={16} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">
                      {session.userAgent ? session.userAgent.slice(0, 70) : 'Unknown device'}
                      {session.current && <Badge tone="success" className="ml-2">This device</Badge>}
                    </p>
                    <p className="text-[10px] text-ink-muted">
                      {session.ip || 'IP unavailable'} · last seen {formatDateTime(session.lastSeenAt)}
                    </p>
                  </div>
                  {!session.current && (
                    <Button variant="ghost" size="sm" onClick={() => revoke(session)} loading={revoking === session.id} icon={<Trash2 size={13} />}>
                      Revoke
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-[11px] text-ink-muted">Use Sign out in the sidebar to end your current session. Revoking another session signs that device out immediately.</p>
      </section>
    </div>
  );
}
