import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageLoader, LinkButton } from './ui';
import type { Role } from '../lib/types';

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader label="Checking your session" />;
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-danger dark:bg-red-500/10">
          <ShieldAlert size={26} />
        </span>
        <h1 className="text-xl font-bold text-ink">This area is restricted</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Your {user.role} account cannot open this page. Use the workspace that matches your role.
        </p>
        <LinkButton
          to={user.role === 'teacher' ? '/teacher' : user.role === 'admin' ? '/admin' : '/dashboard'}
          className="mt-5"
        >
          Go to my dashboard
        </LinkButton>
        <Link to="/" className="mt-3 text-xs font-medium text-ink-muted hover:text-ink">
          Back to homepage
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
