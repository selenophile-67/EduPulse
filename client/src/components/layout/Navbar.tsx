import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell, ChevronDown, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, Sun, UserRound, X, Zap, MonitorSmartphone,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { cn } from '../../lib/cn';
import { Avatar, LinkButton } from '../ui';
import { SearchOverlay } from '../SearchOverlay';
import type { Notification } from '../../lib/types';
import { timeAgo } from '../../lib/format';
import { useQuery } from '@tanstack/react-query';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/courses', label: 'Courses' },
  { to: '/materials', label: 'Study Materials' },
  { to: '/tests', label: 'Test Series' },
  { to: '/materials?premium=free', label: 'Free Resources' },
  { to: '/live-classes', label: 'Live Classes' },
  { to: '/results', label: 'Results' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { user, logout, unreadCount, setUnreadCount } = useAuth();
  const { preference, resolved, setPreference } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'preview'],
    queryFn: () => api.get<{ items: Notification[]; unreadCount: number; total: number }>('/notifications?limit=6'),
    enabled: Boolean(user) && notifyOpen,
  });

  useEffect(() => {
    if (!notifyOpen) return;
    if (notifications) setUnreadCount(notifications.unreadCount);
  }, [notifications, notifyOpen, setUnreadCount]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) setNotifyOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [navigate]);

  const cycleTheme = () => {
    const next = preference === 'light' ? 'dark' : preference === 'dark' ? 'system' : 'light';
    setPreference(next);
  };
  const ThemeIcon = preference === 'system' ? MonitorSmartphone : resolved === 'dark' ? Sun : Moon;

  const handleLogout = async () => {
    await logout();
    queryClient.clear();
    navigate('/');
  };

  const dashboardPath = user?.role === 'teacher' ? '/teacher' : user?.role === 'admin' ? '/admin' : '/dashboard';

  const markAllRead = async () => {
    await api.patch('/notifications/read-all');
    setUnreadCount(0);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line/80 bg-surface/85 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-2" aria-label="EduPulse home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy text-brand shadow-sm dark:bg-white">
              <Zap size={19} className="fill-current" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-ink">
              Edu<span className="text-brand">Pulse</span>
            </span>
          </Link>

          <nav className="ml-3 hidden flex-1 items-center gap-0.5 xl:flex">
            {NAV_ITEMS.slice(0, 8).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-2.5 py-2 text-[13px] font-medium transition',
                    isActive && item.to !== '/materials?premium=free'
                      ? 'bg-brand-soft text-brand-strong dark:bg-brand/10 dark:text-orange-300'
                      : 'text-ink-soft hover:bg-surface-2 hover:text-ink',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-2.5 text-xs text-ink-muted transition hover:border-line-strong hover:text-ink sm:pr-8"
              aria-label="Search"
            >
              <Search size={15} />
              <span className="hidden sm:inline">Search</span>
              <kbd className="ml-1 hidden rounded border border-line bg-surface-2 px-1 text-[10px] font-medium sm:inline">/</kbd>
            </button>

            <button
              type="button"
              onClick={cycleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-2 hover:text-ink"
              aria-label={`Theme: ${preference}. Switch theme`}
              title={`Theme: ${preference}`}
            >
              <ThemeIcon size={16} />
            </button>

            {user ? (
              <>
                <div className="relative" ref={notifyRef}>
                  <button
                    type="button"
                    onClick={() => setNotifyOpen((open) => !open)}
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface-2 hover:text-ink"
                    aria-label="Notifications"
                  >
                    <Bell size={17} />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifyOpen && (
                    <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
                        <p className="text-xs font-bold uppercase tracking-wide text-ink-muted">Notifications</p>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[11px] font-semibold text-brand-strong hover:underline">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {!notifications?.items?.length ? (
                          <p className="px-4 py-8 text-center text-xs text-ink-muted">You are all caught up.</p>
                        ) : (
                          notifications.items.map((notification) => (
                            <button
                              key={notification.id}
                              onClick={() => {
                                setNotifyOpen(false);
                                if (notification.link) navigate(notification.link);
                              }}
                              className={cn('block w-full border-b border-line px-4 py-3 text-left transition hover:bg-surface-2', !notification.readAt && 'bg-brand-soft/50 dark:bg-brand/5')}
                            >
                              <p className="text-xs font-semibold text-ink">{notification.title}</p>
                              {notification.body && <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-muted">{notification.body}</p>}
                              <p className="mt-1 text-[10px] text-ink-muted">{timeAgo(notification.createdAt)}</p>
                            </button>
                          ))
                        )}
                      </div>
                      <Link to="/dashboard/notifications" onClick={() => setNotifyOpen(false)} className="block bg-surface-2 px-4 py-2.5 text-center text-[11px] font-semibold text-ink-soft hover:text-ink">
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>

                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen((open) => !open)}
                    className="ml-0.5 flex items-center gap-1.5 rounded-full border border-line p-0.5 pr-1.5 transition hover:border-line-strong"
                    aria-label="Account menu"
                  >
                    <Avatar name={user.name} color={user.avatarColor} size={30} />
                    <ChevronDown size={13} className="text-ink-muted" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-xl">
                      <div className="border-b border-line px-4 py-3">
                        <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-[11px] text-ink-muted">{user.email}</p>
                        <span className="mt-1.5 inline-block rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">{user.role}</span>
                      </div>
                      <div className="p-1.5">
                        <Link to={dashboardPath} onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-soft hover:bg-surface-2 hover:text-ink">
                          <LayoutDashboard size={14} /> {user.role === 'student' ? 'My dashboard' : 'Workspace'}
                        </Link>
                        <Link to="/dashboard/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-soft hover:bg-surface-2 hover:text-ink">
                          <UserRound size={14} /> Profile
                        </Link>
                        <Link to="/dashboard/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-ink-soft hover:bg-surface-2 hover:text-ink">
                          <Settings size={14} /> Settings
                        </Link>
                        <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-danger hover:bg-red-50 dark:hover:bg-red-500/10">
                          <LogOut size={14} /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden items-center gap-1.5 sm:flex">
                <LinkButton to="/login" variant="ghost" size="sm">Sign in</LinkButton>
                <LinkButton to="/register" variant="primary" size="sm">Get started</LinkButton>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-surface-2 xl:hidden"
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-line bg-surface xl:hidden">
            <nav className="container-x grid grid-cols-2 gap-1 py-3 sm:grid-cols-3">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface-2 hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {!user && (
              <div className="container-x flex gap-2 border-t border-line py-3 sm:hidden">
                <LinkButton to="/login" variant="secondary" size="md" className="flex-1">Sign in</LinkButton>
                <LinkButton to="/register" size="md" className="flex-1">Get started</LinkButton>
              </div>
            )}
          </div>
        )}
      </header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
