import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Mail, MapPin, MessageSquare, Send } from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import { Alert, Button, Field, Input, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';

const SUBJECTS = ['Course enquiry', 'Payments', 'Technical support', 'Educator onboarding', 'Feedback', 'Other'];

export function ContactPage() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: 'Course enquiry', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSending(true);
    try {
      await api.post('/content/contact', {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject,
        message: form.message.trim(),
      });
      setSent(true);
      toast.success('Message sent', 'The team can see it in the admin console.');
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-page">
      <section className="border-b border-line bg-navy text-white">
        <div className="container-x py-12 lg:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/80">
            <MessageSquare size={12} /> Contact
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Talk to the EduPulse team.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">
            Questions about courses, enrolment, payments or educator onboarding? Send a message — it reaches the admin console directly.
          </p>
        </div>
      </section>

      <div className="container-x grid gap-6 py-10 lg:grid-cols-[1fr_360px] lg:py-14">
        <div className="card p-6 sm:p-8">
          {sent ? (
            <div className="flex flex-col items-center py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-emerald-600 dark:bg-success/10 dark:text-emerald-300"><CheckCircle2 size={26} /></span>
              <h2 className="mt-4 text-xl font-bold text-ink">Message received</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
                Thanks, {form.name.split(' ')[0] || 'there'}. Your message is now in the support queue. The team replies within one working day.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button variant="secondary" onClick={() => { setSent(false); setForm({ name: '', email: '', subject: 'Course enquiry', message: '' }); }}>
                  Send another message
                </Button>
                <Link to="/courses" className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-brand-strong">
                  Browse courses <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-ink">Send a message</h2>
                <p className="mt-1 text-xs text-ink-muted">Every message is validated on the server before it enters the support queue.</p>
              </div>

              {error && <Alert tone="danger" title="Message not sent">{error}</Alert>}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" htmlFor="contact-name">
                  <Input id="contact-name" value={form.name} onChange={(event) => update('name', event.target.value)} required minLength={2} maxLength={80} placeholder="Aarav Sharma" autoComplete="name" />
                </Field>
                <Field label="Email address" htmlFor="contact-email">
                  <Input id="contact-email" type="email" value={form.email} onChange={(event) => update('email', event.target.value)} required placeholder="you@example.com" autoComplete="email" />
                </Field>
              </div>

              <Field label="Subject" htmlFor="contact-subject">
                <select id="contact-subject" value={form.subject} onChange={(event) => update('subject', event.target.value)} className="field cursor-pointer">
                  {SUBJECTS.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                </select>
              </Field>

              <Field label="Message" htmlFor="contact-message" hint="Include the course or test name if your question is about a specific item.">
                <Textarea id="contact-message" value={form.message} onChange={(event) => update('message', event.target.value)} required minLength={10} maxLength={2000} rows={6} placeholder="Tell us what you need help with…" />
              </Field>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-ink-muted">We never share your email. See the <Link to="/about" className="font-semibold text-brand-strong">FAQ</Link> for quick answers.</p>
                <Button type="submit" loading={sending} icon={<Send size={15} />}>Send message</Button>
              </div>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <p className="text-sm font-semibold text-ink">Support details</p>
            <div className="mt-4 space-y-4 text-sm">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300"><Mail size={16} /></span>
                <div>
                  <p className="text-xs font-semibold text-ink">Email</p>
                  <p className="text-xs text-ink-muted">support@edupulse.demo</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-info dark:bg-blue-500/10"><Clock3 size={16} /></span>
                <div>
                  <p className="text-xs font-semibold text-ink">Response time</p>
                  <p className="text-xs text-ink-muted">Within one working day</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"><MapPin size={16} /></span>
                <div>
                  <p className="text-xs font-semibold text-ink">Platform</p>
                  <p className="text-xs text-ink-muted">Online-first, built for India</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <p className="text-sm font-semibold text-ink">Before you write</p>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-muted">
              <li>Payments are disabled until a gateway is configured — see the checkout page for the exact state.</li>
              <li>Recorded lectures and free materials are available without contacting support.</li>
              <li>Educator accounts are reviewed by an administrator before courses can be published.</li>
            </ul>
          </div>

          <div className="card bg-navy p-5 text-white">
            <p className="text-sm font-semibold">Prefer self-service?</p>
            <p className="mt-1 text-xs leading-relaxed text-white/60">Most answers live in the FAQ and the course pages.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <Link to="/about" className="rounded-lg border border-white/15 px-3 py-1.5 text-white/80 hover:border-brand hover:text-white">Read FAQ</Link>
              <Link to="/courses" className="rounded-lg border border-white/15 px-3 py-1.5 text-white/80 hover:border-brand hover:text-white">Explore courses</Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
