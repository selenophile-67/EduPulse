import crypto from 'node:crypto';
import fs from 'node:fs';
import { z } from 'zod';
import { all, get, run, transaction } from '../config/db.js';
import { env } from '../config/env.js';
import { mapCourse } from '../models/serialize.js';
import { COURSE_SELECT } from '../models/courses.js';
import { hashPassword, EMAIL_RE } from '../utils/auth.js';
import { nowIso, parsePagination, paginated } from '../utils/misc.js';
import { asyncHandler, ApiError, sendData } from '../utils/http.js';
import { adminOverview } from '../services/analytics.service.js';
import { createNotification } from '../services/notification.service.js';

export const overview = asyncHandler(async (_req, res) => {
  return sendData(res, adminOverview());
});

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { limit: 20, max: 100 });
  const { role, status, q } = req.query;
  const where = ['u.deleted_at IS NULL'];
  const params = [];
  if (role) {
    where.push('u.role = ?');
    params.push(role);
  }
  if (status) {
    where.push('u.status = ?');
    params.push(status);
  }
  if (q) {
    const term = `%${String(q).trim()}%`;
    where.push('(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    params.push(term, term, term);
  }
  const whereSql = where.join(' AND ');
  const rows = all(
    `SELECT u.*, sp.target_exam, sp.class_level, tp.approved AS teacher_approved, tp.headline,
      (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id AND e.status = 'active') AS enrollment_count,
      (SELECT COUNT(*) FROM courses c WHERE c.teacher_id = u.id AND c.deleted_at IS NULL) AS course_count
     FROM users u
     LEFT JOIN student_profiles sp ON sp.user_id = u.id
     LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE ${whereSql} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  );
  const total = get(`SELECT COUNT(*) AS count FROM users u WHERE ${whereSql}`, ...params);
  return sendData(res, {
    ...paginated(
      rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        avatarColor: u.avatar_color,
        createdAt: u.created_at,
        targetExam: u.target_exam,
        classLevel: u.class_level,
        teacherApproved: u.teacher_approved === undefined || u.teacher_approved === null ? null : Boolean(u.teacher_approved),
        headline: u.headline,
        enrollmentCount: u.enrollment_count,
        courseCount: u.course_count,
      })),
      total?.count ?? 0,
      page,
      limit,
    ),
  });
});

export const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().regex(EMAIL_RE),
  password: z.string().min(8).max(72),
  role: z.enum(['student', 'teacher', 'admin']),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  if (get('SELECT id FROM users WHERE email = ?', email)) throw ApiError.conflict('That email is already registered.');
  const id = crypto.randomUUID();
  const hash = await hashPassword(password);
  const now = nowIso();
  transaction(() => {
    run(
      `INSERT INTO users (id, email, phone, password_hash, role, name, avatar_color, status, email_verified,
        notification_prefs, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '#6366F1', 'active', 1, ?, ?, ?)`,
      id,
      email,
      phone || null,
      hash,
      role,
      name,
      JSON.stringify({ inApp: true, email: false, push: false }),
      now,
      now,
    );
    if (role === 'student') {
      run(`INSERT INTO student_profiles (user_id, preferred_language, streak_days) VALUES (?, 'English', 0)`, id);
    }
    if (role === 'teacher') {
      run(`INSERT INTO teacher_profiles (user_id, headline, experience_years, approved) VALUES (?, 'Educator on EduPulse', 0, 1)`, id);
    }
  });
  createNotification(id, {
    type: 'account',
    title: 'Your EduPulse account is ready',
    body: 'An administrator created this account for you. Change your password from account settings after signing in.',
    link: '/dashboard/settings',
  });
  return sendData(res, { userId: id }, 201);
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  status: z.enum(['active', 'suspended']).optional(),
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  if (user.id === req.user.id && req.body.status === 'suspended') {
    throw ApiError.badRequest('You cannot suspend your own administrator account.');
  }
  if (req.body.phone) {
    const taken = get('SELECT id FROM users WHERE phone = ? AND id != ?', req.body.phone, user.id);
    if (taken) throw ApiError.conflict('That phone number belongs to another account.');
  }
  run(
    'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), status = COALESCE(?, status), updated_at = ? WHERE id = ?',
    req.body.name ?? null,
    req.body.phone || null,
    req.body.status ?? null,
    nowIso(),
    user.id,
  );
  if (req.body.status === 'suspended') {
    run('UPDATE sessions SET revoked_at = ? WHERE user_id = ?', nowIso(), user.id);
  }
  return sendData(res, { success: true });
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(72).regex(/[A-Za-z]/).regex(/\d/),
});

export const resetUserPassword = asyncHandler(async (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  const hash = await hashPassword(req.body.newPassword);
  transaction(() => {
    run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', hash, nowIso(), user.id);
    run('UPDATE sessions SET revoked_at = ? WHERE user_id = ?', nowIso(), user.id);
  });
  createNotification(user.id, {
    type: 'account',
    title: 'Password reset by administrator',
    body: 'Your password was reset securely by an administrator. Sign in with the new password and update it from settings.',
    link: '/login',
  });
  return sendData(res, { success: true, message: 'Password reset. The user has been signed out everywhere.' });
});

export const listPendingTeachers = asyncHandler(async (_req, res) => {
  const rows = all(
    `SELECT u.id, u.name, u.email, u.phone, u.avatar_color, u.created_at, tp.headline, tp.qualification, tp.subjects
     FROM users u JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE u.role = 'teacher' AND u.deleted_at IS NULL AND tp.approved = 0 ORDER BY u.created_at ASC`,
  );
  return sendData(res, { teachers: rows });
});

export const approveTeacher = asyncHandler(async (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ? AND role = ?', req.params.id, 'teacher');
  if (!user) throw ApiError.notFound('Teacher account not found.');
  run('UPDATE teacher_profiles SET approved = 1 WHERE user_id = ?', user.id);
  createNotification(user.id, {
    type: 'account',
    title: 'Educator account approved',
    body: 'Your educator account is approved. You can now create courses, schedule classes and publish tests.',
    link: '/teacher',
  });
  return sendData(res, { success: true });
});

export const listCourses = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { limit: 20, max: 100 });
  const { q, status, teacher } = req.query;
  const where = ['c.deleted_at IS NULL'];
  const params = [];
  if (q) {
    const term = `%${String(q).trim()}%`;
    where.push('(c.title LIKE ? OR c.exam LIKE ?)');
    params.push(term, term);
  }
  if (status) {
    where.push('c.status = ?');
    params.push(status);
  }
  if (teacher) {
    where.push('c.teacher_id = ?');
    params.push(teacher);
  }
  const whereSql = where.join(' AND ');
  const rows = all(
    `${COURSE_SELECT} WHERE ${whereSql} ORDER BY c.updated_at DESC LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  ).map(mapCourse);
  const total = get(`SELECT COUNT(*) AS count FROM courses c WHERE ${whereSql}`, ...params);
  return sendData(res, paginated(rows, total?.count ?? 0, page, limit));
});

export const adminCourseSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  teacherId: z.string().uuid().optional(),
  priceCents: z.coerce.number().int().min(0).max(100000000).optional(),
  mrpCents: z.coerce.number().int().min(0).max(100000000).optional(),
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = get('SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL', req.params.id);
  if (!course) throw ApiError.notFound('Course not found.');
  if (req.body.teacherId) {
    const teacher = get('SELECT * FROM users WHERE id = ? AND role = ? AND deleted_at IS NULL', req.body.teacherId, 'teacher');
    if (!teacher) throw ApiError.badRequest('Choose a valid educator account.');
    const approved = get('SELECT approved FROM teacher_profiles WHERE user_id = ?', teacher.id);
    if (!approved?.approved) throw ApiError.badRequest('That educator is awaiting approval.');
  }
  if (req.body.status === 'published') {
    const lectures = get('SELECT COUNT(*) AS count FROM lectures WHERE course_id = ?', course.id)?.count ?? 0;
    if (lectures === 0) throw ApiError.badRequest('Add at least one lecture before publishing this course.');
  }
  run(
    `UPDATE courses SET status = COALESCE(?, status), teacher_id = COALESCE(?, teacher_id),
      price_cents = COALESCE(?, price_cents), mrp_cents = COALESCE(?, mrp_cents), updated_at = ?
     WHERE id = ?`,
    req.body.status ?? null,
    req.body.teacherId ?? null,
    req.body.priceCents ?? null,
    req.body.mrpCents ?? null,
    nowIso(),
    course.id,
  );
  if (req.body.status === 'published' && course.status !== 'published') {
    createNotification(course.teacher_id, {
      type: 'course',
      title: 'Course published',
      body: `${course.title} is now live in the EduPulse catalogue.`,
      link: `/teacher/courses/${course.id}`,
    });
  }
  return sendData(res, { course: mapCourse(get(`${COURSE_SELECT} WHERE c.id = ?`, course.id)) });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = get('SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL', req.params.id);
  if (!course) throw ApiError.notFound('Course not found.');
  run(
    `UPDATE courses SET deleted_at = ?, status = 'archived', updated_at = ? WHERE id = ?`,
    nowIso(),
    nowIso(),
    course.id,
  );
  return sendData(res, { success: true });
});

export const listMessages = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { limit: 20 });
  const status = req.query.status;
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];
  const items = all(
    `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  );
  const total = get(`SELECT COUNT(*) AS count FROM contact_messages ${where}`, ...params);
  return sendData(res, paginated(items, total?.count ?? 0, page, limit));
});

export const updateMessage = asyncHandler(async (req, res) => {
  const message = get('SELECT * FROM contact_messages WHERE id = ?', req.params.id);
  if (!message) throw ApiError.notFound('Message not found.');
  run('UPDATE contact_messages SET status = ? WHERE id = ?', req.body.status, message.id);
  return sendData(res, { success: true });
});

export const listSessions = asyncHandler(async (_req, res) => {
  const rows = all(
    `SELECT s.id, s.user_agent, s.ip, s.created_at, s.last_seen_at, u.name, u.email, u.role, u.avatar_color
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.revoked_at IS NULL ORDER BY s.last_seen_at DESC LIMIT 100`,
  );
  return sendData(res, { sessions: rows });
});

export const health = asyncHandler(async (_req, res) => {
  let dbSize = 0;
  try {
    dbSize = fs.statSync(env.dbPath).size;
  } catch {
    dbSize = 0;
  }
  const counts = get(
    `SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM courses) AS courses,
      (SELECT COUNT(*) FROM live_classes) AS live_classes, (SELECT COUNT(*) FROM test_attempts) AS attempts`,
  );
  return sendData(res, {
    status: 'ok',
    environment: env.nodeEnv,
    nodeVersion: process.version,
    uptimeSeconds: Math.round(process.uptime()),
    memoryUsedMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
    dbSizeMb: Math.round((dbSize / 1024 / 1024) * 100) / 100,
    counts,
    integrations: env.integrations,
    emailConfigured: env.integrations.smtp,
    storage: env.integrations.s3 ? 'S3' : 'local disk',
  });
});

export const confirmPaymentDisabled = asyncHandler(async (_req, _res) => {
  throw ApiError.notConfigured(
    'razorpay',
    'Payments are not configured on this deployment. Add Razorpay credentials and complete the server-side verification flow before enabling paid enrollments.',
  );
});
