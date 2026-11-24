import crypto from 'node:crypto';
import { z } from 'zod';
import { all, get, run } from '../config/db.js';
import { env } from '../config/env.js';
import { mapLiveClass } from '../models/serialize.js';
import { nowIso, parsePagination, paginated } from '../utils/misc.js';
import { asyncHandler, ApiError, sendData } from '../utils/http.js';
import { hasCourseAccess, assertCourseManager } from '../services/access.service.js';
import { notifyCourseEnrollees, createNotification } from '../services/notification.service.js';
import { issueLiveKitToken, livekitStatus } from '../services/livekit.service.js';

const LIVE_SELECT = `
  SELECT lc.*, c.title AS course_title, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
    (SELECT COUNT(*) FROM attendance a WHERE a.live_class_id = lc.id) AS attendee_count
  FROM live_classes lc
  LEFT JOIN courses c ON c.id = lc.course_id
  JOIN users u ON u.id = lc.teacher_id
`;

export const listLiveClasses = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query, { limit: 12 });
  const { status, courseId, mine } = req.query;
  const now = nowIso();
  const where = [];
  const params = [];
  if (courseId) {
    where.push('lc.course_id = ?');
    params.push(courseId);
  }
  if (mine === '1' && req.user) {
    where.push('lc.teacher_id = ?');
    params.push(req.user.id);
  }
  if (status === 'upcoming') {
    where.push(`lc.status = 'scheduled' AND lc.scheduled_start > ?`);
    params.push(now);
  } else if (status === 'live') {
    where.push(`lc.status IN ('scheduled','live') AND lc.scheduled_start <= ? AND lc.scheduled_end >= ?`);
    params.push(now, now);
  } else if (status === 'completed') {
    where.push(`(lc.status = 'completed' OR (lc.status = 'scheduled' AND lc.scheduled_end < ?))`);
    params.push(now);
  } else if (status === 'cancelled') {
    where.push(`lc.status = 'cancelled'`);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = get(`SELECT COUNT(*) AS count FROM live_classes lc ${whereSql}`, ...params);
  const orderParams = [];
  let orderSql;
  if (status === 'completed') {
    orderSql = 'ORDER BY lc.scheduled_start DESC';
  } else {
    orderSql = `ORDER BY CASE
        WHEN lc.status IN ('scheduled','live') AND lc.scheduled_start <= ? AND lc.scheduled_end >= ? THEN 0
        WHEN lc.scheduled_start > ? THEN 1
        ELSE 2 END, lc.scheduled_start ASC`;
    orderParams.push(now, now, now);
  }
  const rows = all(
    `${LIVE_SELECT} ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    ...params,
    ...orderParams,
    limit,
    (page - 1) * limit,
  );
  const integration = livekitStatus();
  const items = rows.map((row) => {
    const mapped = mapLiveClass(row);
    const isCourseMember = row.course_id ? hasCourseAccess(req.user, row.course_id) : true;
    const isOwner = req.user && (req.user.id === row.teacher_id || req.user.role === 'admin');
    return {
      ...mapped,
      canJoin:
        mapped.status === 'live' &&
        (isOwner || (req.user && isCourseMember)) &&
        (integration.configured || mapped.hasJoinLink),
      streamingConfigured: integration.configured || mapped.hasJoinLink,
    };
  });
  return sendData(res, { ...paginated(items, total?.count ?? 0, page, limit), streaming: integration });
});

export const liveClassDetail = asyncHandler(async (req, res) => {
  const row = get(`${LIVE_SELECT} WHERE lc.id = ?`, req.params.id);
  if (!row) throw ApiError.notFound('Live class not found.');
  const mapped = mapLiveClass(row);
  const isOwner = req.user && (req.user.id === row.teacher_id || req.user.role === 'admin');
  const isCourseMember = row.course_id ? hasCourseAccess(req.user, row.course_id) : true;
  const integration = livekitStatus();
  const attendance = req.user
    ? get(
        'SELECT * FROM attendance WHERE live_class_id = ? AND user_id = ?',
        row.id,
        req.user.id,
      )
    : null;
  return sendData(res, {
    liveClass: {
      ...mapped,
      canJoin:
        mapped.status === 'live' &&
        (isOwner || (req.user && isCourseMember)) &&
        (integration.configured || mapped.hasJoinLink),
      attendeeCount: row.attendee_count,
    },
    isOwner: Boolean(isOwner),
    attended: Boolean(attendance),
    streaming: integration,
  });
});

export const liveClassSchema = z.object({
  title: z.string().trim().min(4).max(140),
  description: z.string().trim().max(1000).optional().default(''),
  courseId: z.string().uuid().nullable().optional(),
  scheduledStart: z.string().datetime({ offset: true }).or(z.string().datetime()),
  scheduledEnd: z.string().datetime({ offset: true }).or(z.string().datetime()),
  joinUrl: z.string().url().or(z.literal('')).optional().default(''),
});

export const createLiveClass = asyncHandler(async (req, res) => {
  const { title, description, courseId, scheduledStart, scheduledEnd, joinUrl } = req.body;
  const start = new Date(scheduledStart).getTime();
  const end = new Date(scheduledEnd).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    throw ApiError.badRequest('The class end time must be after the start time.');
  }
  if (courseId) {
    const course = get('SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL', courseId);
    if (!course) throw ApiError.notFound('Course not found.');
    assertCourseManager(req.user, courseId);
  }
  const id = crypto.randomUUID();
  run(
    `INSERT INTO live_classes (id, course_id, teacher_id, title, description, scheduled_start, scheduled_end,
      room_name, join_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
    id,
    courseId || null,
    req.user.id,
    title,
    description,
    new Date(start).toISOString(),
    new Date(end).toISOString(),
    `edupulse-${id.slice(0, 8)}`,
    joinUrl || null,
    nowIso(),
  );
  if (courseId) {
    const course = get('SELECT title FROM courses WHERE id = ?', courseId);
    notifyCourseEnrollees(courseId, {
      type: 'live_class',
      title: 'New live class scheduled',
      body: `${title} for ${course.title} starts ${new Date(start).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}.`,
      link: '/dashboard/live',
    });
  }
  return sendData(res, { liveClass: mapLiveClass(get(`${LIVE_SELECT} WHERE lc.id = ?`, id)) }, 201);
});

export const updateLiveClassSchema = z.object({
  title: z.string().trim().min(4).max(140).optional(),
  description: z.string().trim().max(1000).optional(),
  scheduledStart: z.string().optional(),
  scheduledEnd: z.string().optional(),
  joinUrl: z.string().url().or(z.literal('')).optional(),
  status: z.enum(['scheduled', 'live', 'completed', 'cancelled']).optional(),
  recordingUrl: z.string().url().or(z.literal('')).optional(),
});

export const updateLiveClass = asyncHandler(async (req, res) => {
  const liveClass = get('SELECT * FROM live_classes WHERE id = ?', req.params.id);
  if (!liveClass) throw ApiError.notFound('Live class not found.');
  if (req.user.role !== 'admin' && liveClass.teacher_id !== req.user.id) {
    throw ApiError.forbidden('Only the class teacher can update this session.');
  }
  const data = req.body;
  if (data.scheduledStart && data.scheduledEnd) {
    if (new Date(data.scheduledEnd) <= new Date(data.scheduledStart)) {
      throw ApiError.badRequest('The class end time must be after the start time.');
    }
  }
  run(
    `UPDATE live_classes SET title = COALESCE(?, title), description = COALESCE(?, description),
      scheduled_start = COALESCE(?, scheduled_start), scheduled_end = COALESCE(?, scheduled_end),
      join_url = COALESCE(?, join_url), status = COALESCE(?, status), recording_url = COALESCE(?, recording_url)
     WHERE id = ?`,
    data.title ?? null,
    data.description ?? null,
    data.scheduledStart ? new Date(data.scheduledStart).toISOString() : null,
    data.scheduledEnd ? new Date(data.scheduledEnd).toISOString() : null,
    data.joinUrl || null,
    data.status ?? null,
    data.recordingUrl || null,
    liveClass.id,
  );
  if (data.status === 'cancelled' && liveClass.course_id) {
    notifyCourseEnrollees(liveClass.course_id, {
      type: 'live_class',
      title: 'Live class cancelled',
      body: `${liveClass.title} has been cancelled. It will be rescheduled soon.`,
      link: '/dashboard/live',
    });
  }
  return sendData(res, { liveClass: mapLiveClass(get(`${LIVE_SELECT} WHERE lc.id = ?`, liveClass.id)) });
});

export const joinLiveClass = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') throw ApiError.forbidden('Only students join classes from this endpoint.');
  const liveClass = get('SELECT * FROM live_classes WHERE id = ?', req.params.id);
  if (!liveClass) throw ApiError.notFound('Live class not found.');
  const now = Date.now();
  const start = new Date(liveClass.scheduled_start).getTime();
  const end = new Date(liveClass.scheduled_end).getTime();
  const isLive = liveClass.status === 'live' || (liveClass.status === 'scheduled' && now >= start && now <= end);
  if (liveClass.status === 'cancelled') throw ApiError.badRequest('This class was cancelled.');
  if (!isLive) throw ApiError.badRequest('This class is not live right now.');
  if (liveClass.course_id && !hasCourseAccess(req.user, liveClass.course_id)) {
    throw ApiError.forbidden('Enroll in the course to join this class.');
  }
  const existing = get(
    'SELECT * FROM attendance WHERE live_class_id = ? AND user_id = ?',
    liveClass.id,
    req.user.id,
  );
  if (!existing) {
    run(
      'INSERT INTO attendance (id, live_class_id, user_id, joined_at, status) VALUES (?, ?, ?, ?, ?)',
      crypto.randomUUID(),
      liveClass.id,
      req.user.id,
      nowIso(),
      'present',
    );
  }
  if (env.integrations.livekit) {
    const session = issueLiveKitToken({
      room: liveClass.room_name,
      identity: req.user.id,
      name: req.user.name,
      canPublish: false,
    });
    return sendData(res, { provider: 'livekit', ...session });
  }
  if (liveClass.join_url) {
    return sendData(res, { provider: 'external', joinUrl: liveClass.join_url });
  }
  throw ApiError.notConfigured(
    'livekit',
    'Live streaming is not configured for this class yet. The teacher can join an external meeting link or an administrator can enable LiveKit credentials.',
  );
});

export const classAttendance = asyncHandler(async (req, res) => {
  const liveClass = get('SELECT * FROM live_classes WHERE id = ?', req.params.id);
  if (!liveClass) throw ApiError.notFound('Live class not found.');
  if (req.user.role !== 'admin' && liveClass.teacher_id !== req.user.id) {
    throw ApiError.forbidden('Only the class teacher can view attendance.');
  }
  const rows = liveClass.course_id
    ? all(
        `SELECT u.id, u.name, u.email, u.avatar_color, a.joined_at, a.status
         FROM enrollments e JOIN users u ON u.id = e.user_id
         LEFT JOIN attendance a ON a.user_id = u.id AND a.live_class_id = ?
         WHERE e.course_id = ? AND e.status = 'active' ORDER BY u.name`,
        liveClass.id,
        liveClass.course_id,
      )
    : all(
        `SELECT u.id, u.name, u.email, u.avatar_color, a.joined_at, a.status
         FROM attendance a JOIN users u ON u.id = a.user_id WHERE a.live_class_id = ? ORDER BY u.name`,
        liveClass.id,
      );
  return sendData(res, {
    liveClass: { id: liveClass.id, title: liveClass.title },
    students: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      avatarColor: r.avatar_color,
      joinedAt: r.joined_at,
      status: r.status || 'absent',
    })),
  });
});

export const teacherLiveClasses = asyncHandler(async (req, res) => {
  const rows = all(
    `${LIVE_SELECT} WHERE lc.teacher_id = ? ORDER BY lc.scheduled_start DESC LIMIT 50`,
    req.user.id,
  );
  return sendData(res, {
    liveClasses: rows.map(mapLiveClass),
    streaming: livekitStatus(),
  });
});

export const liveIntegrationStatus = asyncHandler(async (_req, res) => {
  return sendData(res, {
    streaming: livekitStatus(),
    note: env.integrations.livekit
      ? 'LiveKit credentials detected. Rooms are created on first join.'
      : 'Live streaming requires LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET. Until then, classes can be scheduled and tracked but not streamed in-app.',
  });
});
