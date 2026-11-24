import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3, Bell, Bookmark, BookOpen, CalendarDays, ChevronLeft, ClipboardList, FileText, GraduationCap,
  LayoutDashboard, Library, ListChecks, LogOut, Mail, Menu, MonitorSmartphone, Moon, PlayCircle, PlugZap,
  Search, Settings, ShieldCheck, Sun, UserRound, Users, Video, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import { Avatar } from '../ui';
import { SearchOverlay } from '../SearchOverlay';
import { cn } from '../../lib/cn';
import type { Role } from '../../lib/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  badge?: number;
}

const STUDENT_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/learning', label: 'My Learning', icon: BookOpen },
  { to: '/dashboard/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/dashboard/tests', label: 'My Tests', icon: ListChecks },
  { to: '/dashboard/results', label: 'Results', icon: ClipboardList },
  { to: '/dashboard/performance', label: 'Performance', icon: BarChart3 },
  { to: '/dashboard/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const TEACHER_NAV: NavItem[] = [
  { to: '/teacher', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/teacher/courses', label: 'My Courses', icon: BookOpen },
  { to: '/teacher/tests', label: 'Test Builder', icon: ListChecks },
  { to: '/teacher/live-classes', label: 'Live Classes', icon: Video },
  { to: '/teacher/students', label: 'Students', icon: Users },
  { to: '/teacher/materials', label: 'Study Materials', icon: FileText },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/teachers', label: 'Teacher Approvals', icon: GraduationCap },
  { to: '/admin/messages', label: 'Contact Messages', icon: Mail },
  { to: '/admin/sessions', label: 'Active Sessions', icon: ShieldCheck },
  { to: '/admin/integrations', label: 'Integrations', icon: PlugZap },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

export function navForRole(role: Role): NavItem[] {
  return role === 'teacher' ? TEACHER_NAV : role === 'admin' ? ADMIN_NAV : STUDENT_NAV;
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { preference, resolved, setPreference } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    setMobileOpen(false);
  }, [navigate]);

  if (!user) return null;

  const items = navForRole(user.role);
  const workspaceLabel = user.role === 'teacher' ? 'Educator workspace' : user.role === 'admin' ? 'Admin console' : 'Student workspace';
  const ThemeIcon = preference === 'system' ? MonitorSmartphone : resolved === 'dark' ? Sun : Moon;

  const cycleTheme = () => setPreference(preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light');

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    navigate('/');
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-line px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy text-brand dark:bg-white">
            <Zap size={17} className="fill-current" />
          </span>
          <span className="font-display text-base font-extrabold text-ink">
            Edu<span className="text-brand">Pulse</span>
          </span>
        </Link>
        <span className="ml-auto rounded-md bg-surface-2 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-muted">{user.role}</span>
      </div>

      <div className="px-3 pb-2 pt-4">
        <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-muted">{workspaceLabel}</p>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl bg-surface-2 px-2.5 py-2">
          <Avatar name={user.name} color={user.avatarColor} size={32} />
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
            <p className="truncate text-[10px] text-ink-muted">{user.email}</p>
          </div>
        </div>
        {user.role === 'student' && (user.profile?.streakDays || 0) > 0 && (
          <div className="mt-2 flex items-center justify-between rounded-lg border border-brand/20 bg-brand-soft px-2.5 py-1.5 text-[10px] font-semibold text-brand-strong dark:bg-brand/10 dark:text-orange-300">
            <span>Daily streak</span>
            <span>{user.profile?.streakDays} days 🔥</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition',
                isActive ? 'bg-navy text-white shadow-sm dark:bg-white dark:text-navy' : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
              )
            }
          >
            <item.icon size={16} />
            {item.label}
          </NavLink>
        ))}
        <div className="my-3 h-px bg-line" />
        <NavLink to="/dashboard/profile" className={({ isActive }) => cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition', isActive ? 'bg-navy text-white dark:bg-white dark:text-navy' : 'text-ink-soft hover:bg-surface-2 hover:text-ink')}>
          <UserRound size={16} /> Profile
        </NavLink>
        <NavLink to="/dashboard/settings" className={({ isActive }) => cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition', isActive ? 'bg-navy text-white dark:bg-white dark:text-navy' : 'text-ink-soft hover:bg-surface-2 hover:text-ink')}>
          <Settings size={16} /> Settings
        </NavLink>
        {user.role === 'student' && (
          <NavLink to="/dashboard/ai-tutor" className={({ isActive }) => cn('flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition', isActive ? 'bg-navy text-white dark:bg-white dark:text-navy' : 'text-ink-soft hover:bg-surface-2 hover:text-ink')}>
            <PlayCircle size={16} /> AI Tutor
          </NavLink>
        )}
      </nav>

      <div className="border-t border-line p-3">
        <Link to="/" className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-ink-muted hover:bg-surface-2 hover:text-ink">
          <Library size={14} /> Back to website
        </Link>
        <button onClick={handleLogout} className="mt-0.5 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-danger hover:bg-red-50 dark:hover:bg-red-500/10">
          <LogOut size={14} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-page">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-line bg-surface lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="animate-fade-up absolute inset-y-0 left-0 w-64 border-r border-line bg-surface shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-surface/85 px-4 backdrop-blur-xl sm:px-6">
          <button onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-2 lg:hidden" aria-label="Open navigation">
            <Menu size={19} />
          </button>
          <div className="hidden items-center gap-1.5 text-xs text-ink-muted sm:flex">
            <span className="font-semibold text-ink">{workspaceLabel}</span>
            <ChevronLeft size={12} className="rotate-180" />
            <span>EduPulse</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink"
              aria-label="Search"
            >
              <Search size={17} />
            </button>
            <button
              onClick={cycleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink"
              aria-label={`Theme: ${preference}`}
            >
              <ThemeIcon size={16} />
            </button>
            <Link
              to="/dashboard/notifications"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink"
              aria-label="Notifications"
            >
              <Bell size={17} />
            </Link>
            <Link to="/dashboard/profile" className="ml-0.5">
              <Avatar name={user.name} color={user.avatarColor} size={30} />
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
