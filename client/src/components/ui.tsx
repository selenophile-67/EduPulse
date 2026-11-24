import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { Link, type LinkProps } from 'react-router-dom';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, Star, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { initials } from '../lib/format';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'navy' | 'white';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand text-white shadow-sm shadow-brand/25 hover:bg-brand-strong focus-visible:ring-brand/35 disabled:bg-brand/60',
  secondary:
    'bg-surface-2 text-ink border border-line hover:border-line-strong hover:bg-surface-3 focus-visible:ring-ink/10',
  outline:
    'border border-line-strong bg-transparent text-ink hover:border-ink-muted hover:bg-surface-2 focus-visible:ring-ink/10',
  ghost: 'text-ink-soft hover:bg-surface-2 hover:text-ink focus-visible:ring-ink/10',
  danger: 'bg-danger text-white hover:bg-red-600 focus-visible:ring-danger/30',
  success: 'bg-success text-white hover:bg-emerald-600 focus-visible:ring-success/30',
  navy: 'bg-navy text-white hover:bg-navy-800 focus-visible:ring-navy/30 dark:bg-white dark:text-navy dark:hover:bg-white/90',
  white: 'bg-white text-navy hover:bg-white/90 focus-visible:ring-white/40',
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 rounded-lg px-3 text-xs gap-1.5',
  md: 'h-10 rounded-xl px-4 text-sm gap-2',
  lg: 'h-12 rounded-xl px-6 text-[15px] gap-2',
  icon: 'h-9 w-9 rounded-lg justify-center',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className?: string) {
  return cn(
    'inline-flex select-none items-center justify-center font-semibold transition focus-visible:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, children, disabled, ...props },
  ref,
) {
  return (
    <button ref={ref} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...props}>
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
});

export function LinkButton({
  variant = 'primary',
  size = 'md',
  className,
  children,
  icon,
  ...props
}: LinkProps & { variant?: Variant; size?: Size; icon?: ReactNode; children: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...props}>
      {icon}
      {children}
    </Link>
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
}

type Tone = 'neutral' | 'brand' | 'success' | 'danger' | 'warning' | 'info' | 'navy' | 'violet';

const TONES: Record<Tone, string> = {
  neutral: 'border-line bg-surface-2 text-ink-soft',
  brand: 'border-brand/20 bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300',
  success: 'border-success/20 bg-success-soft text-emerald-700 dark:bg-success/10 dark:text-emerald-300',
  danger: 'border-danger/20 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
  warning: 'border-warning/20 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
  info: 'border-info/20 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  navy: 'border-navy/10 bg-navy text-white dark:border-white/10',
  violet: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/20 dark:bg-violet-500/10 dark:text-violet-300',
};

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-5',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Avatar({
  name,
  color,
  size = 40,
  className,
}: {
  name: string;
  color?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white', className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color || '#F97316'}, ${color || '#F97316'}cc)`,
        fontSize: Math.max(11, Math.round(size * 0.34)),
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function Progress({
  value,
  className,
  tone = 'brand',
  size = 'md',
}: {
  value: number;
  className?: string;
  tone?: 'brand' | 'success' | 'navy';
  size?: 'sm' | 'md';
}) {
  const colors = { brand: 'bg-brand', success: 'bg-success', navy: 'bg-navy dark:bg-white' };
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-surface-3', size === 'sm' ? 'h-1.5' : 'h-2', className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500', colors[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={cn('animate-spin text-brand', className)} />;
}

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[46vh] flex-col items-center justify-center gap-3">
      <Spinner size={28} />
      <p className="text-sm text-ink-muted">{label}…</p>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="card overflow-hidden p-4">
          <Skeleton className="mb-4 h-28 w-full rounded-xl" />
          <Skeleton className="mb-2 h-4 w-4/5" />
          <Skeleton className="mb-4 h-3 w-2/3" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center', className)}>
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-2 text-ink-muted">
        {icon || <Inbox size={22} />}
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-danger/20 bg-surface px-6 py-12 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-danger dark:bg-red-500/10">
        <AlertTriangle size={20} />
      </span>
      <h3 className="text-base font-semibold">Could not load this content</h3>
      <p className="mt-1 max-w-md text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Alert({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const styles = {
    info: 'border-info/25 bg-blue-50 text-blue-900 dark:bg-blue-500/10 dark:text-blue-200',
    warning: 'border-warning/25 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200',
    success: 'border-success/25 bg-success-soft text-emerald-900 dark:bg-success/10 dark:text-emerald-200',
    danger: 'border-danger/25 bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-200',
  };
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm leading-relaxed', styles[tone], className)}>
      {title && <p className="mb-0.5 font-semibold">{title}</p>}
      <div className="opacity-90">{children}</div>
    </div>
  );
}

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
  htmlFor?: string;
}

export function Field({ label, error, hint, className, children, htmlFor }: FieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error ? <p className="mt-1.5 text-xs font-medium text-danger">{error}</p> : hint ? <p className="mt-1.5 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return <input ref={ref} className={cn('field', invalid && 'border-danger focus:border-danger focus:ring-danger/10', className)} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn('field min-h-24 resize-y', className)} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn('field cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
});

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="field pl-9"
      />
    </div>
  );
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-surface-2 p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition',
            value === tab.value ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="rounded-full bg-surface-2 px-1.5 text-[10px] font-semibold text-ink-muted">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Pagination({
  page,
  total,
  limit,
  onPage,
}: {
  page: number;
  total: number;
  limit: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-8 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-ink-muted">
        Page <span className="font-semibold text-ink">{page}</span> of {pages} · {total} results
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)} icon={<ChevronLeft size={14} />}>
          Prev
        </Button>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('animate-fade-up relative w-full rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl', widths[size])}>
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-ink-muted">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink" aria-label="Close dialog">
            <X size={17} />
          </button>
        </div>
        {children && <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>}
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'brand',
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: 'brand' | 'success' | 'info' | 'violet' | 'amber';
  className?: string;
}) {
  const tones = {
    brand: 'bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300',
    success: 'bg-success-soft text-emerald-600 dark:bg-success/10 dark:text-emerald-300',
    info: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
  };
  return (
    <div className={cn('card p-4 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold leading-none text-ink">{value}</p>
        </div>
        {icon && <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>{icon}</span>}
      </div>
      {hint && <div className="mt-3 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn('mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', align === 'center' && 'sm:flex-col sm:items-center sm:text-center', className)}>
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand">{eyebrow}</p>}
        <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-ink-muted sm:text-[15px]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function RatingStars({ value, size = 13, showValue = false, count }: { value: number | null; size?: number; showValue?: boolean; count?: number }) {
  const rating = value || 0;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="flex items-center gap-0.5 text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} size={size} className={star <= Math.round(rating) ? 'fill-amber-400' : 'text-line-strong'} />
        ))}
      </span>
      {showValue && <span className="text-xs font-semibold text-ink">{rating ? rating.toFixed(1) : 'New'}</span>}
      {count !== undefined && <span className="text-[11px] text-ink-muted">({count})</span>}
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-line', className)} />;
}

export function KeyValue({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-ink-muted">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
