import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { Role, User } from '../lib/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  unreadCount: number;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<User | null>;
  setUser: (user: User | null) => void;
  setUnreadCount: (count: number) => void;
  can: (...roles: Role[]) => boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'teacher';
  phone?: string;
  targetExam?: string;
  classLevel?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const queryClient = useQueryClient();

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: User; unreadNotifications: number }>('/auth/me');
      setUser(data.user);
      setUnreadCount(data.unreadNotifications ?? 0);
      return data.user;
    } catch {
      setUser(null);
      setUnreadCount(0);
      return null;
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await api.post<{ user: User }>('/auth/login', { email, password });
      setUser(data.user);
      queryClient.clear();
      try {
        const badge = await api.get<{ unreadCount: number }>('/notifications/badge');
        setUnreadCount(badge.unreadCount);
      } catch {
        setUnreadCount(0);
      }
      return data.user;
    },
    [queryClient],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const data = await api.post<{ user: User }>('/auth/register', payload);
      setUser(data.user);
      queryClient.clear();
      return data.user;
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
      setUnreadCount(0);
      queryClient.clear();
    }
  }, [queryClient]);

  const can = useCallback((...roles: Role[]) => Boolean(user && roles.includes(user.role)), [user]);

  const value = useMemo(
    () => ({ user, loading, unreadCount, login, register, logout, refresh, setUser, setUnreadCount, can }),
    [user, loading, unreadCount, login, register, logout, refresh, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
