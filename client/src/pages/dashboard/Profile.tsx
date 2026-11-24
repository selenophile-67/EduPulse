import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, GraduationCap, Mail, Phone, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import type { User } from '../../lib/types';
import { Avatar, Badge, Button, Field, Input, SectionHeading, Select, Textarea } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../lib/format';

const EXAMS = ['JEE Main', 'JEE Advanced', 'NEET UG', 'UPSC CSE', 'SSC CGL', 'Banking', 'GATE', 'CUET', 'Class 12 Boards', 'Foundation'];
const LEVELS = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'Graduate', 'Working professional'];
const LANGUAGES = ['English', 'Hindi', 'Hinglish'];

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    targetExam: '',
    classLevel: '',
    preferredLanguage: '',
    learningGoal: '',
    headline: '',
    qualification: '',
    experienceYears: '',
    subjects: '',
    bio: '',
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || '',
      phone: user.phone || '',
      targetExam: user.profile?.targetExam || '',
      classLevel: user.profile?.classLevel || '',
      preferredLanguage: user.profile?.preferredLanguage || '',
      learningGoal: user.profile?.learningGoal || '',
      headline: user.profile?.headline || '',
      qualification: user.profile?.qualification || '',
      experienceYears: user.profile?.experienceYears !== null && user.profile?.experienceYears !== undefined ? String(user.profile.experienceYears) : '',
      subjects: user.profile?.subjects || '',
      bio: user.profile?.bio || '',
    });
  }, [user]);

  const { data: sessionsInfo } = useQuery({
    queryKey: ['auth-sessions'],
    queryFn: () => api.get<{ sessions: { id: string; current?: boolean; lastSeenAt: string }[] }>('/auth/sessions'),
  });
  const currentSession = sessionsInfo?.sessions.find((session) => session.current);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        phone: form.phone.trim(),
      };
      if (user?.role === 'student') {
        Object.assign(payload, {
          targetExam: form.targetExam,
          classLevel: form.classLevel,
          preferredLanguage: form.preferredLanguage,
          learningGoal: form.learningGoal.trim(),
        });
      }
      if (user?.role === 'teacher') {
        Object.assign(payload, {
          headline: form.headline.trim(),
          qualification: form.qualification.trim(),
          subjects: form.subjects.trim(),
          bio: form.bio.trim(),
        });
        if (form.experienceYears.trim()) payload.experienceYears = Number(form.experienceYears);
      }
      const result = await api.patch<{ user: User }>('/auth/me', payload);
      setUser(result.user);
      toast.success('Profile updated', 'Your changes are saved to your account.');
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Account" title="Profile" description="Update the details used across your workspace and public educator profile." />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <div className="card p-5 text-center">
            <Avatar name={user.name} color={user.avatarColor} size={72} className="mx-auto" />
            <h2 className="mt-3 text-lg font-bold text-ink">{user.name}</h2>
            <p className="text-xs text-ink-muted">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <Badge tone="brand">{user.role}</Badge>
              <Badge tone={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>
              {user.role === 'teacher' && (
                <Badge tone={user.profile?.approved ? 'success' : 'warning'}>
                  {user.profile?.approved ? 'Approved educator' : 'Approval pending'}
                </Badge>
              )}
            </div>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-left text-xs">
              <p className="flex items-center gap-2 text-ink-muted"><Mail size={13} /> {user.emailVerified ? 'Email verified' : 'Email verification not required in this build'}</p>
              <p className="flex items-center gap-2 text-ink-muted"><ShieldCheck size={13} /> Member since {formatDate(user.createdAt)}</p>
              {user.role === 'student' && (
                <p className="flex items-center gap-2 text-ink-muted"><Sparkles size={13} /> {user.profile?.streakDays || 0} day learning streak</p>
              )}
              {user.role === 'teacher' && user.profile?.experienceYears !== null && user.profile?.experienceYears !== undefined && (
                <p className="flex items-center gap-2 text-ink-muted"><GraduationCap size={13} /> {user.profile.experienceYears} years teaching</p>
              )}
            </div>
          </div>

          {currentSession && (
            <div className="card p-5">
              <p className="text-sm font-semibold text-ink">Current session</p>
              <p className="mt-1 text-[11px] text-ink-muted">Last active {formatDate(currentSession.lastSeenAt, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</p>
            </div>
          )}
        </aside>

        <form onSubmit={submit} className="card space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <UserRound size={16} className="text-brand" />
            <h3 className="text-sm font-bold text-ink">Personal details</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="profile-name">
              <Input id="profile-name" value={form.name} onChange={(event) => update('name', event.target.value)} required minLength={2} maxLength={80} />
            </Field>
            <Field label="Phone number" htmlFor="profile-phone" hint="Optional, used for account recovery only.">
              <div className="relative">
                <Phone size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <Input id="profile-phone" value={form.phone} onChange={(event) => update('phone', event.target.value)} maxLength={20} className="pl-9" placeholder="+91 98765 43210" />
              </div>
            </Field>
            <Field label="Email address" htmlFor="profile-email" hint="Email changes require administrator support in this build.">
              <Input id="profile-email" value={user.email} disabled />
            </Field>
            <Field label="Role">
              <Input value={user.role} disabled />
            </Field>
          </div>

          {user.role === 'student' && (
            <div className="space-y-4 border-t border-line pt-5">
              <h3 className="text-sm font-bold text-ink">Learning preferences</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Target exam" htmlFor="profile-exam">
                  <Select id="profile-exam" value={form.targetExam} onChange={(event) => update('targetExam', event.target.value)}>
                    <option value="">Not set</option>
                    {EXAMS.map((exam) => <option key={exam} value={exam}>{exam}</option>)}
                  </Select>
                </Field>
                <Field label="Class / stage" htmlFor="profile-level">
                  <Select id="profile-level" value={form.classLevel} onChange={(event) => update('classLevel', event.target.value)}>
                    <option value="">Not set</option>
                    {LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                  </Select>
                </Field>
                <Field label="Preferred language" htmlFor="profile-language">
                  <Select id="profile-language" value={form.preferredLanguage} onChange={(event) => update('preferredLanguage', event.target.value)}>
                    <option value="">Not set</option>
                    {LANGUAGES.map((language) => <option key={language} value={language}>{language}</option>)}
                  </Select>
                </Field>
                <Field label="Learning goal" htmlFor="profile-goal" className="sm:col-span-2">
                  <Textarea id="profile-goal" value={form.learningGoal} onChange={(event) => update('learningGoal', event.target.value)} maxLength={300} rows={3} placeholder="e.g. Score 650+ in NEET 2027 with daily 3-hour practice" />
                </Field>
              </div>
            </div>
          )}

          {user.role === 'teacher' && (
            <div className="space-y-4 border-t border-line pt-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">Educator profile</h3>
                <Badge tone={user.profile?.approved ? 'success' : 'warning'}>
                  {user.profile?.approved ? <><BadgeCheck size={10} /> Public</> : 'Pending review'}
                </Badge>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Headline" htmlFor="profile-headline" className="sm:col-span-2">
                  <Input id="profile-headline" value={form.headline} onChange={(event) => update('headline', event.target.value)} maxLength={120} placeholder="IIT Delhi · Physics for JEE" />
                </Field>
                <Field label="Qualification" htmlFor="profile-qualification">
                  <Input id="profile-qualification" value={form.qualification} onChange={(event) => update('qualification', event.target.value)} maxLength={160} placeholder="M.Sc. Physics, IIT Delhi" />
                </Field>
                <Field label="Experience (years)" htmlFor="profile-experience">
                  <Input id="profile-experience" type="number" min={0} max={60} value={form.experienceYears} onChange={(event) => update('experienceYears', event.target.value)} />
                </Field>
                <Field label="Subjects" htmlFor="profile-subjects" className="sm:col-span-2">
                  <Input id="profile-subjects" value={form.subjects} onChange={(event) => update('subjects', event.target.value)} maxLength={200} placeholder="Physics, Mechanics, Electromagnetism" />
                </Field>
                <Field label="Bio" htmlFor="profile-bio" className="sm:col-span-2">
                  <Textarea id="profile-bio" value={form.bio} onChange={(event) => update('bio', event.target.value)} maxLength={1200} rows={4} placeholder="Teaching approach, achievements and what students can expect." />
                </Field>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-[11px] text-ink-muted">Changes are validated and stored server-side.</p>
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
