import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from './AuthShell';
import { Alert, Button, Field, Input } from '../../components/ui';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.post<{ message: string }>('/auth/reset-password', { token, password });
      toast.success('Password updated', data.message);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Reset links are single-use and expire after one hour."
      footer={<Link to="/login" className="font-semibold text-brand-strong hover:underline">Back to sign in</Link>}
    >
      {!token ? (
        <Alert tone="warning" title="No reset token found">
          Open the reset link from your email, or contact support if you need help restoring access.
        </Alert>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Field label="New password" htmlFor="new-password" hint="Minimum 8 characters, with at least one letter and one number.">
            <Input id="new-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password" htmlFor="confirm-password">
            <Input id="confirm-password" type="password" required value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete="new-password" />
          </Field>
          <Button type="submit" size="lg" loading={loading} className="w-full">Update password</Button>
        </form>
      )}
    </AuthShell>
  );
}
