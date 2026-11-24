import { all, get, run } from '../config/db.js';
import { mapNotification } from '../models/serialize.js';
import { parsePagination, paginated, nowIso } from '../utils/misc.js';
import { asyncHandler, ApiError, sendData } from '../utils/http.js';
import { unreadCount } from '../services/notification.service.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { limit: 20 });
  const filter = req.query.filter === 'unread' ? 'AND read_at IS NULL' : '';
  const items = all(
    `SELECT * FROM notifications WHERE user_id = ? ${filter} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    req.user.id,
    limit,
    offset,
  ).map(mapNotification);
  const total = get(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? ${filter}`,
    req.user.id,
  );
  return sendData(res, {
    ...paginated(items, total?.count ?? 0, page, limit),
    unreadCount: unreadCount(req.user.id),
  });
});

export const markRead = asyncHandler(async (req, res) => {
  const notification = get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  if (!notification) throw ApiError.notFound('Notification not found.');
  run('UPDATE notifications SET read_at = COALESCE(read_at, ?) WHERE id = ?', nowIso(), notification.id);
  return sendData(res, { success: true, unreadCount: unreadCount(req.user.id) });
});

export const markAllRead = asyncHandler(async (req, res) => {
  run('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL', nowIso(), req.user.id);
  return sendData(res, { success: true, unreadCount: 0 });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', req.params.id, req.user.id);
  if (!notification) throw ApiError.notFound('Notification not found.');
  run('DELETE FROM notifications WHERE id = ?', notification.id);
  return sendData(res, { success: true, unreadCount: unreadCount(req.user.id) });
});

export const notificationBadge = asyncHandler(async (req, res) => {
  return sendData(res, { unreadCount: unreadCount(req.user.id) });
});
