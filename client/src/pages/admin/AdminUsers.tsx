import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, Pencil, Plus, Search, ShieldCheck, UserRoundX } from 'lucide-react';
import { api, errorMessage, queryString } from '../../lib/api';
import type { AdminUserRow, Paginated } from '../../lib/types';
import { Avatar, Badge, Button, ErrorState, Field, Input, Modal, PageLoader, Pagination, Select } from '../../components/ui';
import { formatDate } from '../../lib/format';
import { useToast } from '../../context/ToastContext';

type EditTarget = AdminUserRow | null;

export function AdminUsersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'student', phone: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', status: 'active' });
  const [savingEdit, setSavingEdit] = useState(false);
  const [resetTarget, setResetTarget] = useState<EditTarget>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { setQuery(q); setPage(1); }, 350);
    return () => window.clearTimeout(timer);
  }, [q]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-users', { page, query, role, status }],
    queryFn: () => api.get<Paginated<AdminUserRow>>(`/admin/users${queryString({ page, limit: 20, q: query, role, status })}`),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    queryClient.invalidateQueries({ queryKey: ['admin-teachers'] });
  };

  const createUser = async () => {
    setCreateError('');
    setCreating(true);
    try {
      await api.post('/admin/users', {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        phone: createForm.phone,
      });
      toast.success('Account created', 'The user can sign in immediately with this password.');
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'student', phone: '' });
      invalidate();
    } catch (cause) {
      setCreateError(errorMessage(cause));
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (user: AdminUserRow) => {
    setEditTarget(user);
    setEditForm({ name: user.name, phone: user.phone ?? '', status: user.status });
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    setSavingEdit(true);
    try {
      await api.patch(`/admin/users/${editTarget.id}`, {
        name: editForm.name,
        phone: editForm.phone,
        status: editForm.status,
      });
      toast.success('User updated');
      setEditTarget(null);
      invalidate();
    } catch (cause) {
      toast.error('Could not update user', errorMessage(cause));
    } finally {
      setSavingEdit(false);
    }
  };

  const resetPassword = async () => {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const result = await api.post<{ message: string }>(`/admin/users/${resetTarget.id}/reset-password`, { newPassword });
      toast.success('Password reset', result.message);
      setResetTarget(null);
      setNewPassword('');
    } catch (cause) {
      toast.error('Could not reset password', errorMessage(cause));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Users</h1>
          <p className="mt-1 text-sm text-ink-muted">Create accounts, suspend access and reset credentials. Suspending revokes all sessions.</p>
        </div>
        <Button onClick={() => { setCreateError(''); setCreateOpen(true); }} icon={<Plus size={15} />}>New user</Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search name, email or phone…" className="h-9 pl-8 text-sm" />
        </div>
        <Select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="h-9 w-36 text-xs" aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="admin">Admins</option>
        </Select>
        <Select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-9 w-36 text-xs" aria-label="Filter by status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </Select>
        <span className="text-xs text-ink-muted">{data?.total ?? 0} users</span>
      </div>

      {isLoading ? (
        <PageLoader label="Loading users" />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.items.length ? (
        <div className="card p-10 text-center text-sm text-ink-muted">No users match these filters.</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-2 text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-2.5 font-semibold">User</th>
                  <th className="px-4 py-2.5 font-semibold">Role</th>
                  <th className="px-4 py-2.5 font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Enrolments</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Joined</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user.id} className="border-b border-line/60 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={user.name} color={user.avatarColor} size={28} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{user.name}</p>
                          <p className="truncate text-[11px] text-ink-muted">{user.email}{user.phone ? ` · ${user.phone}` : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.role === 'admin' ? 'violet' : user.role === 'teacher' ? 'info' : 'neutral'}>{user.role}</Badge>
                      {user.role === 'teacher' && user.teacherApproved === false && <p className="mt-1 text-[10px] text-amber-600">Awaiting approval</p>}
                    </td>
                    <td className="px-4 py-3"><Badge tone={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge></td>
                    <td className="px-4 py-3 text-right tabular-nums">{user.enrollmentCount}</td>
                    <td className="px-4 py-3 text-right text-[11px] text-ink-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(user)} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink" aria-label={`Edit ${user.name}`}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => { setResetTarget(user); setNewPassword(''); }} className="rounded-md p-1.5 text-ink-muted hover:bg-surface-2 hover:text-ink" aria-label={`Reset password for ${user.name}`}>
                          <KeyRound size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data && data.total > data.limit && (
        <Pagination page={page} total={data.total} limit={data.limit} onPage={setPage} />
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create an account" description="Use a strong password. The user is notified in-app." footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createUser} loading={creating}>Create user</Button></>}>
        <div className="space-y-4">
          {createError && <p className="rounded-lg border border-danger/25 bg-red-50 px-3 py-2 text-xs text-danger dark:bg-red-500/10">{createError}</p>}
          <Field label="Full name" htmlFor="new-name"><Input id="new-name" value={createForm.name} onChange={(event) => setCreateForm({ ...createForm, name: event.target.value })} /></Field>
          <Field label="Email" htmlFor="new-email"><Input id="new-email" type="email" value={createForm.email} onChange={(event) => setCreateForm({ ...createForm, email: event.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Temporary password" hint="At least 8 characters." htmlFor="new-password"><Input id="new-password" value={createForm.password} onChange={(event) => setCreateForm({ ...createForm, password: event.target.value })} /></Field>
            <Field label="Role" htmlFor="new-role">
              <Select id="new-role" value={createForm.role} onChange={(event) => setCreateForm({ ...createForm, role: event.target.value })}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
          </div>
          <Field label="Phone (optional)" htmlFor="new-phone"><Input id="new-phone" value={createForm.phone} onChange={(event) => setCreateForm({ ...createForm, phone: event.target.value })} /></Field>
        </div>
      </Modal>

      <Modal open={Boolean(editTarget)} onClose={() => setEditTarget(null)} title={`Edit ${editTarget?.name || 'user'}`} footer={<><Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button><Button onClick={saveEdit} loading={savingEdit}>Save changes</Button></>}>
        <div className="space-y-4">
          <Field label="Name" htmlFor="edit-name"><Input id="edit-name" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} /></Field>
          <Field label="Phone" htmlFor="edit-phone"><Input id="edit-phone" value={editForm.phone} onChange={(event) => setEditForm({ ...editForm, phone: event.target.value })} /></Field>
          <Field label="Status" hint="Suspending a user immediately revokes every active session." htmlFor="edit-status">
            <Select id="edit-status" value={editForm.status} onChange={(event) => setEditForm({ ...editForm, status: event.target.value })}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </Field>
          {editForm.status === 'suspended' && (
            <p className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              <UserRoundX size={14} className="mt-0.5 shrink-0" /> The user will be signed out everywhere and cannot log in until reactivated.
            </p>
          )}
        </div>
      </Modal>

      <Modal open={Boolean(resetTarget)} onClose={() => setResetTarget(null)} title={`Reset password for ${resetTarget?.name || 'user'}`} description="The server hashes this password and revokes all sessions for the account." footer={<><Button variant="secondary" onClick={() => setResetTarget(null)}>Cancel</Button><Button onClick={resetPassword} loading={resetting} icon={<ShieldCheck size={14} />}>Reset password</Button></>}>
        <Field label="New password" hint="At least 8 characters with a letter and a number." htmlFor="reset-password">
          <Input id="reset-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        </Field>
        <p className="mt-3 text-[11px] text-ink-muted">The user receives an in-app notification and must sign in again on every device.</p>
      </Modal>
    </div>
  );
}
