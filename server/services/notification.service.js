import crypto from 'node:crypto';
import { all, get, run } from '../config/db.js';
import { nowIso } from '../utils/misc.js';

export function createNotification(userId, { type, title, body = null, link = null }) {
  if (!userId) return;
  run(
    `INSERT INTO notifications (id, user_id, type, title, body, link, read_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?)`,
    crypto.randomUUID(),
    userId,
    type,
    title,
    body,
    link,
    nowIso(),
  );
}

export function notifyCourseEnrollees(courseId, notification) {
  const students = all(
    `SELECT user_id FROM enrollments WHERE course_id = ? AND status = 'active'`,
    courseId,
  );
  for (const student of students) createNotification(student.user_id, notification);
}

export function notifyMany(userIds, notification) {
  for (const id of userIds) createNotification(id, notification);
}

export function unreadCount(userId) {
  const row = get('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL', userId);
  return row?.count ?? 0;
}
