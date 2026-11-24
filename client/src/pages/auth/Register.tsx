import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, UserRound } from 'lucide-react';
import { AuthShell } from './AuthShell';
import { Alert, Button, Field, Input, Select } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { cn } from '../../lib/cn';

const EXAMS = ['JEE Main', 'JEE Advanced', 'NEET UG', 'UPSC CSE', 'SSC CGL', 'IBPS PO', 'GATE CSE', 'CUET UG', 'CBSE Class 10', 'CBSE Class 12', 'Foundation'];
const CLASS_LEVELS = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Graduate', 'Graduate+'];

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate(user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
  }, [user, navigate]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Password must be at least 8 characters and include a letter and a number.');
      return;
    }
    setLoading(true);
    try {
      const created = await register({
        name,
        email,
        password,
        role,
        phone: phone || undefined,
        targetExam: role === 'student' ? targetExam || undefined : undefined,
        classLevel: role === 'student' ? classLevel || undefined : undefined,
      });
      toast.success('Account created', role === 'teacher' ? 'Educator accounts need admin approval before publishing.' : 'Start with a free course or a practice test.');
      navigate(created.role === 'teacher' ? '/teacher' : '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join free, learn at your pace and keep every attempt on record."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-strong hover:underline">Sign in</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'student', label: 'I am a student', description: 'Courses, tests & lectures', icon: UserRound },
            { value: 'teacher', label: 'I am an educator', description: 'Teach on EduPulse', icon: GraduationCap },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRole(option.value as 'student' | 'teacher')}
              className={cn(
                'rounded-xl border p-3 text-left transition',
                role === option.value ? 'border-brand bg-brand-soft ring-2 ring-brand/20 dark:bg-brand/10' : 'border-line bg-surface hover:border-line-strong',
              )}
            >
              <option.icon size={17} className={role === option.value ? 'text-brand-strong' : 'text-ink-muted'} />
              <p className="mt-2 text-xs font-semibold text-ink">{option.label}</p>
              <p className="mt-0.5 text-[10px] text-ink-muted">{option.description}</p>
            </button>
          ))}
        </div>
        {role === 'teacher' && (
          <Alert tone="warning">Educator accounts are reviewed by an administrator before courses can be published.</Alert>
        )}

        <Field label="Full name" htmlFor="name">
          <Input id="name" required minLength={2} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ananya Sharma" autoComplete="name" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email address" htmlFor="reg-email">
            <Input id="reg-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" />
          </Field>
          <Field label="Mobile (optional)" htmlFor="phone">
            <Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit number" autoComplete="tel" />
          </Field>
        </div>
        <Field label="Password" htmlFor="reg-password" hint="Minimum 8 characters, with at least one letter and one number.">
          <Input id="reg-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a strong password" autoComplete="new-password" />
        </Field>

        {role === 'student' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Target exam" htmlFor="targetExam">
              <Select id="targetExam" value={targetExam} onChange={(event) => setTargetExam(event.target.value)}>
                <option value="">Select an exam</option>
                {EXAMS.map((exam) => <option key={exam} value={exam}>{exam}</option>)}
              </Select>
            </Field>
            <Field label="Current level" htmlFor="classLevel">
              <Select id="classLevel" value={classLevel} onChange={(event) => setClassLevel(event.target.value)}>
                <option value="">Select your level</option>
                {CLASS_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
              </Select>
            </Field>
          </div>
        )}

        <Button type="submit" size="lg" loading={loading} className="w-full">Create account</Button>
        <p className="text-center text-[10px] leading-relaxed text-ink-muted">
          By creating an account you agree to use EduPulse responsibly. Demo content is for learning purposes only.
        </p>
      </form>
    </AuthShell>
  );
}
