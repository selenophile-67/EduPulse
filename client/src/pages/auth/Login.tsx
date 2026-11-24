import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, ShieldCheck, UserRound } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Alert, Button, Field, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ApiError, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import type { Role } from '../../lib/types';

const DEMO_ACCOUNTS: { role: Role; label: string; email: string; password: string; icon: typeof UserRound }[] = [
  { role: 'student', label: 'Student', email: 'student@edupulse.demo', password: 'Student@123', icon: UserRound },
  { role: 'teacher', label: 'Teacher', email: 'teacher@edupulse.demo', password: 'Teacher@123', icon: GraduationCap },
  { role: 'admin', label: 'Admin', email: 'admin@edupulse.demo', password: 'Admin@123', icon: ShieldCheck },
];

function dashboardFor(role: Role) {
  return role === 'teacher' ? '/teacher' : role === 'admin' ? '/admin' : '/dashboard';
}

export function LoginPage() {
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const redirect = params.get('redirect');

  useEffect(() => {
    if (user) navigate(redirect && redirect.startsWith('/') ? redirect : dashboardFor(user.role), { replace: true });
  }, [user, navigate, redirect]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const signedIn = await login(email, password);
      toast.success(`Welcome back, ${signedIn.name.split(' ')[0]}`);
      navigate(redirect && redirect.startsWith('/') ? redirect : dashboardFor(signedIn.role), { replace: true });
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429 ? 'Too many sign-in attempts. Wait a few minutes and try again.' : errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up your lectures, tests and study plan."
      footer={
        <>
          New to EduPulse?{' '}
          <Link to="/register" className="font-semibold text-brand-strong hover:underline">Create an account</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Email address" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted hover:text-ink"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>
        <div className="flex items-center justify-between text-xs">
          <Link to="/forgot-password" className="font-medium text-brand-strong hover:underline">Forgot password?</Link>
          <span className="text-ink-muted">Sessions stay signed in for 7 days</span>
        </div>
        <Button type="submit" size="lg" loading={loading} className="w-full">Sign in</Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-line bg-surface p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">Development demo accounts</p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              onClick={() => {
                setEmail(account.email);
                setPassword(account.password);
                setError('');
              }}
              className="flex flex-col items-center gap-1 rounded-lg border border-line bg-surface px-2 py-2.5 text-[11px] font-semibold text-ink-soft transition hover:border-brand hover:text-brand-strong"
            >
              <account.icon size={15} />
              {account.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">
          Seed credentials for local development only. Do not use these accounts in production.
        </p>
      </div>
    </AuthShell>
  );
}
