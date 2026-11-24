import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass, Home, Search } from 'lucide-react';
import { LinkButton } from '../components/ui';

export function NotFoundPage() {
  const location = useLocation();
  return (
    <div className="container-x flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300">
        <Compass size={30} />
      </span>
      <p className="mt-5 font-display text-5xl font-extrabold tracking-tight text-ink">404</p>
      <h1 className="mt-2 text-xl font-bold text-ink">This page took a wrong turn</h1>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
        We could not find <span className="font-medium text-ink-soft">{location.pathname}</span>. It may have moved, or the link may be incomplete.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <LinkButton to="/" icon={<Home size={15} />}>Back to homepage</LinkButton>
        <LinkButton to="/courses" variant="secondary" icon={<Search size={15} />}>Browse courses</LinkButton>
      </div>
      <Link to="/contact" className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft size={12} /> Something broken? Tell us
      </Link>
    </div>
  );
}
