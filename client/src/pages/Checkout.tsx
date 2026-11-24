import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, BadgeCheck, CreditCard, Lock, ShieldCheck, ShieldX, Sparkles,
} from 'lucide-react';
import { api, errorMessage } from '../lib/api';
import type { CourseDetail, IntegrationStatus } from '../lib/types';
import { Alert, Badge, Button, ErrorState, LinkButton, PageLoader } from '../components/ui';
import { formatCurrency } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export function CheckoutPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [enrolling, setEnrolling] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['course-checkout', slug, Boolean(user)],
    queryFn: () => api.get<CourseDetail>(`/courses/${slug}`),
    enabled: Boolean(slug),
  });

  const { data: config } = useQuery({
    queryKey: ['platform-config'],
    queryFn: () => api.get<IntegrationStatus>('/content/config'),
    staleTime: 300_000,
  });

  if (isLoading) return <div className="container-x"><PageLoader label="Preparing checkout" /></div>;
  if (error || !data) {
    return (
      <div className="container-x py-16">
        <ErrorState message={errorMessage(error) || 'This course could not be found.'} onRetry={() => refetch()} />
      </div>
    );
  }

  const { course, access } = data;
  const paymentsEnabled = Boolean(config?.integrations?.razorpay);

  const enrollFree = async () => {
    setEnrolling(true);
    try {
      await api.post('/enrollments', { courseId: course.id });
      toast.success('Enrolled', 'This free course is now in My Learning.');
      navigate(`/dashboard/learning/${course.id}`);
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setEnrolling(false);
    }
  };

  if (access.hasAccess) {
    return (
      <div className="container-x flex min-h-[60vh] items-center justify-center py-14">
        <div className="card w-full max-w-lg p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-soft text-emerald-600 dark:bg-success/10 dark:text-emerald-300"><BadgeCheck size={26} /></span>
          <h1 className="mt-4 text-xl font-bold text-ink">You already have access</h1>
          <p className="mt-2 text-sm text-ink-muted">{course.title} is active on your account.</p>
          <LinkButton to={`/dashboard/learning/${course.id}`} className="mt-5" icon={<ArrowRight size={15} />}>Continue learning</LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-page">
      <div className="container-x py-10 lg:py-14">
        <Link to={`/courses/${course.slug}`} className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition hover:text-ink">
          <ArrowLeft size={13} /> Back to course
        </Link>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-5">
            <div className="card p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                  <ShieldX size={21} />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-ink">Online payments are not configured</h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    EduPulse never activates paid access from a frontend success message. Enrolment must be confirmed by the server after verifying a payment with the gateway.
                  </p>
                </div>
              </div>

              <Alert tone="warning" title="This build has no live payment gateway" className="mt-5">
                {config?.notes?.payments || 'No payment gateway credentials are configured on this deployment, so paid courses cannot be purchased right now. Free courses work end to end.'}
              </Alert>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line bg-surface-2/60 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted"><Lock size={12} /> What will never happen</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
                    <li>No access unlocked from a client-side “success” screen.</li>
                    <li>No simulation of a payment confirmation.</li>
                    <li>No card details ever handled by the frontend.</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-line bg-surface-2/60 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-muted"><ShieldCheck size={12} /> Server-side release</p>
                  <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-ink-muted">
                    <li>Order creation and signature verification are server-only.</li>
                    <li>Webhooks are the source of truth for enrolment.</li>
                    <li>Idempotent handlers prevent double activation.</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <LinkButton to={`/courses/${course.slug}`} variant="secondary" icon={<ArrowLeft size={14} />}>Back to course</LinkButton>
                {course.isFree && (
                  <Button onClick={enrollFree} loading={enrolling} icon={<Sparkles size={15} />}>Enroll free</Button>
                )}
                <LinkButton to="/contact" variant="outline" icon={<CreditCard size={14} />}>Ask about payments</LinkButton>
              </div>

              <p className="mt-4 text-[11px] text-ink-muted">
                Gateway status: <span className="font-semibold text-ink-soft">{paymentsEnabled ? 'credentials detected — checkout flow is not enabled in this build' : 'not configured'}</span>
              </p>
            </div>

            <div className="card p-6">
              <h2 className="text-base font-semibold text-ink">What you get with this course</h2>
              <ul className="mt-3 grid gap-2 text-sm text-ink-soft sm:grid-cols-2">
                {[
                  'Full curriculum access after enrolment',
                  'Recorded lectures with progress tracking',
                  'Course tests with server-side scoring',
                  'Study materials and downloadable notes',
                  'Live class schedule and attendance',
                  'Real rank only when a cohort exists',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <BadgeCheck size={14} className="mt-0.5 shrink-0 text-success" /> {item}
                  </li>
                ))}
              </ul>
              {course.teacher && (
                <p className="mt-4 text-xs text-ink-muted">Mentored by <span className="font-semibold text-ink-soft">{course.teacher.name}</span></p>
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card overflow-hidden">
              <div className="border-b border-line bg-navy p-5 text-white">
                <Badge tone="navy" className="border-white/20 bg-white/10">{course.exam}</Badge>
                <h2 className="mt-2 line-clamp-3 font-display text-lg font-bold leading-snug">{course.title}</h2>
                <p className="mt-1 text-xs text-white/50">{course.level} · {course.language}</p>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Course fee</p>
                <div className="mt-1 flex items-end gap-2">
                  <span className="font-display text-3xl font-extrabold text-ink">{formatCurrency(course.priceCents)}</span>
                  {course.mrpCents > course.priceCents && (
                    <span className="mb-1 text-sm text-ink-muted line-through">{formatCurrency(course.mrpCents)}</span>
                  )}
                </div>
                {course.discountPercent > 0 && <p className="mt-1 text-xs font-semibold text-success">{course.discountPercent}% off the listed price</p>}
                <div className="mt-4 space-y-2 border-t border-line pt-4 text-xs text-ink-muted">
                  <div className="flex justify-between"><span>Lectures</span><span className="font-semibold text-ink">{course.lectureCount}</span></div>
                  <div className="flex justify-between"><span>Validity</span><span className="font-semibold text-ink">{course.validityDays} days</span></div>
                  <div className="flex justify-between"><span>Learners enrolled</span><span className="font-semibold text-ink">{course.enrolledCount}</span></div>
                </div>
                <div className="mt-5">
                  {course.isFree ? (
                    user?.role === 'student' ? (
                      <Button className="w-full" size="lg" onClick={enrollFree} loading={enrolling}>Enroll for free</Button>
                    ) : (
                      <LinkButton to={user ? '/dashboard' : `/login?redirect=/checkout/${course.slug}`} className="w-full" size="lg">
                        {user ? 'Switch to a student account' : 'Sign in to enroll'}
                      </LinkButton>
                    )
                  ) : (
                    <Button className="w-full" size="lg" disabled icon={<Lock size={15} />}>Payment gateway not configured</Button>
                  )}
                </div>
                <p className="mt-3 text-center text-[11px] text-ink-muted">No payment is being requested or processed on this page.</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
