import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, Phone, Zap } from 'lucide-react';
import { api, errorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { Button } from '../ui';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { to: '/courses', label: 'All courses' },
      { to: '/materials', label: 'Study materials' },
      { to: '/tests', label: 'Test series' },
      { to: '/live-classes', label: 'Live classes' },
      { to: '/results', label: 'Results' },
    ],
  },
  {
    title: 'Exams',
    links: [
      { to: '/courses?exam=JEE+Main', label: 'JEE Main' },
      { to: '/courses?exam=NEET+UG', label: 'NEET UG' },
      { to: '/courses?exam=UPSC+CSE', label: 'UPSC CSE' },
      { to: '/courses?exam=SSC+CGL', label: 'SSC CGL' },
      { to: '/courses?exam=GATE+CSE', label: 'GATE CSE' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About EduPulse' },
      { to: '/contact', label: 'Contact us' },
      { to: '/about#faqs', label: 'FAQs' },
      { to: '/login', label: 'Student login' },
      { to: '/register', label: 'Create account' },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const subscribe = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const data = await api.post<{ message: string }>('/content/newsletter', { email });
      toast.success('Subscribed', data.message);
      setEmail('');
    } catch (error) {
      toast.error('Could not subscribe', errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-x py-12">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr_1.6fr]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-brand dark:bg-white">
                <Zap size={19} className="fill-current" />
              </span>
              <span className="font-display text-lg font-extrabold text-ink">
                Edu<span className="text-brand">Pulse</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-muted">
              Structured courses, recorded lectures, live sessions and honest analytics for India&apos;s most competitive exams.
            </p>
            <div className="mt-5 space-y-2.5 text-xs text-ink-muted">
              <p className="flex items-center gap-2"><Mail size={13} /> support@edupulse.demo</p>
              <p className="flex items-center gap-2"><Phone size={13} /> +91 98000 00000</p>
              <p className="flex items-center gap-2"><MapPin size={13} /> Bengaluru, Karnataka, India</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink">{column.title}</p>
                <ul className="mt-3 space-y-2">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link to={link.to} className="text-[13px] text-ink-muted transition hover:text-brand-strong">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink">Weekly study digest</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Exam updates, high-yield notes and one practice set — every Sunday.
            </p>
            <form onSubmit={subscribe} className="mt-3">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Your email address"
                  className="field min-w-0 flex-1 text-xs"
                  aria-label="Email address for newsletter"
                />
                <Button type="submit" size="md" loading={loading} aria-label="Subscribe" className="px-3">
                  <ArrowRight size={16} />
                </Button>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-ink-muted">No spam. Unsubscribe anytime.</p>
            </form>
            <div className="mt-5 rounded-xl border border-line bg-surface-2 p-3">
              <p className="text-[11px] font-semibold text-ink">Transparent by design</p>
              <p className="mt-1 text-[10px] leading-relaxed text-ink-muted">
                LIVE labels only appear for scheduled sessions currently in progress. Analytics come from your real attempts.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 text-[11px] text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} EduPulse Learning Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-ink">Terms</Link>
            <Link to="/about" className="hover:text-ink">Privacy</Link>
            <Link to="/contact" className="hover:text-ink">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
