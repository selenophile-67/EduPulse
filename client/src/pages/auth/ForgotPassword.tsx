import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { Alert, Button, Field, Input } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ message: string; emailConfigured: boolean } | null>(null);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.post<{ message: string; emailConfigured: boolean }>('/auth/forgot-password', { email });
      setResult(data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will send a secure reset link if an account matches your email."
      footer={<Link to="/login" className="font-semibold text-brand-strong hover:underline">Back to sign in</Link>}
    >
      {result ? (
        <div className="space-y-4">
          <Alert tone={result.emailConfigured ? 'success' : 'warning'}>{result.message}</Alert>
          <p className="text-xs leading-relaxed text-ink-muted">
            For this deployment, an administrator can reset your password from the admin console if email delivery is unavailable.
          </p>
          <Link to="/contact" className="text-xs font-semibold text-brand-strong hover:underline">Contact support</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="Email address" htmlFor="forgot-email">
            <Input id="forgot-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
          </Field>
          <Button type="submit" size="lg" loading={loading} className="w-full">Send reset link</Button>
        </form>
      )}
    </AuthShell>
  );
}
