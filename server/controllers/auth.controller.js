import crypto from 'node:crypto';
import { z } from 'zod';
import { all, get, run, transaction } from '../config/db.js';
import { env } from '../config/env.js';
import {
  hashPassword, verifyPassword, signToken, cookieOptions, newSessionId,
  readToken, verifyToken, hashToken, randomToken, EMAIL_RE,
} from '../utils/auth.js';
import { ApiError, sendData, asyncHandler } from '../utils/http.js';
import { nowIso, parseJson } from '../utils/misc.js';
import { publicUser } from '../models/serialize.js';
import { createNotification } from '../services/notification.service.js';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72)
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().regex(EMAIL_RE, 'Enter a valid email address'),
  password: passwordSchema,
  role: z.enum(['student', 'teacher']).default('student'),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  targetExam: z.string().trim().max(60).optional(),
  classLevel: z.string().trim().max(40).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().regex(EMAIL_RE, 'Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

function startSession(req, res, user) {
  const sessionId = newSessionId();
  const token = signToken({ sub: user.id, role: user.role, jti: sessionId });
  run(
    `INSERT INTO sessions (id, user_id, user_agent, ip, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    sessionId,
    user.id,
    req.headers['user-agent']?.slice(0, 300) || null,
    req.ip || null,
    nowIso(),
    nowIso(),
  );
  res.cookie(env.cookieName, token, cookieOptions());
  return sessionId;
}

function profileFor(user) {
  if (user.role === 'student') {
    return get('SELECT * FROM student_profiles WHERE user_id = ?', user.id) || {};
  }
  if (user.role === 'teacher') {
    return get('SELECT * FROM teacher_profiles WHERE user_id = ?', user.id) || {};
  }
  return {};
}

function mePayload(user) {
  const profile = profileFor(user);
  return {
    ...publicUser(user),
    profile: {
      targetExam: profile.target_exam || null,
      classLevel: profile.class_level || null,
      preferredLanguage: profile.preferred_language || null,
      dob: profile.dob || null,
      learningGoal: profile.learning_goal || null,
      streakDays: profile.streak_days ?? 0,
      headline: profile.headline || null,
      qualification: profile.qualification || null,
      experienceYears: profile.experience_years ?? null,
      subjects: profile.subjects || null,
      bio: profile.bio || null,
      approved: profile.approved === undefined ? null : Boolean(profile.approved),
    },
  };
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, targetExam, classLevel } = req.body;
  const existing = get('SELECT id FROM users WHERE email = ?', email);
  if (existing) throw ApiError.conflict('An account with this email already exists. Try signing in.');
  if (phone) {
    const phoneTaken = get('SELECT id FROM users WHERE phone = ?', phone);
    if (phoneTaken) throw ApiError.conflict('This mobile number is already linked to another account.');
  }

  const now = nowIso();
  const userId = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const palette = ['#F97316', '#10B981', '#6366F1', '#EC4899', '#0EA5E9', '#EAB308'];
  const avatarColor = palette[Math.floor(Math.random() * palette.length)];

  transaction(() => {
    run(
      `INSERT INTO users (id, email, phone, password_hash, role, name, avatar_color, status, email_verified,
        notification_prefs, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`,
      userId,
      email,
      phone || null,
      passwordHash,
      role,
      name,
      avatarColor,
      JSON.stringify({ inApp: true, email: false, push: false }),
      now,
      now,
    );
    if (role === 'student') {
      run(
        `INSERT INTO student_profiles (user_id, class_level, target_exam, preferred_language, streak_days)
         VALUES (?, ?, ?, 'English', 0)`,
        userId,
        classLevel || null,
        targetExam || null,
      );
    } else {
      run(
        `INSERT INTO teacher_profiles (user_id, headline, experience_years, approved)
         VALUES (?, ?, 0, 0)`,
        userId,
        'Educator on EduPulse',
      );
    }
  });

  const user = get('SELECT * FROM users WHERE id = ?', userId);
  startSession(req, res, user);
  createNotification(userId, {
    type: 'account',
    title: 'Welcome to EduPulse',
    body:
      role === 'teacher'
        ? 'Your educator account is pending administrator approval. You can set up your profile meanwhile.'
        : 'Explore free courses, practice tests and study materials to get started.',
    link: role === 'teacher' ? '/teacher' : '/courses',
  });
  return sendData(res, { user: mePayload(user) }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = get('SELECT * FROM users WHERE email = ? AND deleted_at IS NULL', email);
  if (!user) throw ApiError.unauthorized('Email or password is incorrect.');
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw ApiError.unauthorized('Email or password is incorrect.');
  if (user.status === 'suspended') {
    throw ApiError.forbidden('This account is suspended. Please contact support for help.');
  }
  startSession(req, res, user);
  return sendData(res, { user: mePayload(user) });
});

export const logout = asyncHandler(async (req, res) => {
  const token = readToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      run('UPDATE sessions SET revoked_at = ? WHERE id = ?', nowIso(), payload.jti);
    } catch {
      /* expired token still clears the cookie */
    }
  }
  res.clearCookie(env.cookieName, { ...cookieOptions(), maxAge: undefined });
  return sendData(res, { success: true });
});

export const me = asyncHandler(async (req, res) => {
  const unread = get(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL',
    req.user.id,
  );
  return sendData(res, { user: mePayload(req.user), unreadNotifications: unread?.count ?? 0 });
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  targetExam: z.string().trim().max(60).optional(),
  classLevel: z.string().trim().max(40).optional(),
  preferredLanguage: z.string().trim().max(30).optional(),
  learningGoal: z.string().trim().max(300).optional(),
  headline: z.string().trim().max(120).optional(),
  qualification: z.string().trim().max(160).optional(),
  experienceYears: z.coerce.number().int().min(0).max(60).optional(),
  subjects: z.string().trim().max(200).optional(),
  bio: z.string().trim().max(1200).optional(),
});

export const updateProfile = asyncHandler(async (req, res) => {
  const data = req.body;
  const now = nowIso();
  if (data.phone) {
    const taken = get('SELECT id FROM users WHERE phone = ? AND id != ?', data.phone, req.user.id);
    if (taken) throw ApiError.conflict('That mobile number is already in use.');
  }
  transaction(() => {
    run(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = ? WHERE id = ?',
      data.name ?? null,
      data.phone || null,
      now,
      req.user.id,
    );
    if (req.user.role === 'student') {
      run(
        `UPDATE student_profiles SET target_exam = COALESCE(?, target_exam),
          class_level = COALESCE(?, class_level), preferred_language = COALESCE(?, preferred_language),
          learning_goal = COALESCE(?, learning_goal) WHERE user_id = ?`,
        data.targetExam ?? null,
        data.classLevel ?? null,
        data.preferredLanguage ?? null,
        data.learningGoal ?? null,
        req.user.id,
      );
    }
    if (req.user.role === 'teacher') {
      run(
        `UPDATE teacher_profiles SET headline = COALESCE(?, headline),
          qualification = COALESCE(?, qualification), experience_years = COALESCE(?, experience_years),
          subjects = COALESCE(?, subjects), bio = COALESCE(?, bio) WHERE user_id = ?`,
        data.headline ?? null,
        data.qualification ?? null,
        data.experienceYears ?? null,
        data.subjects ?? null,
        data.bio ?? null,
        req.user.id,
      );
    }
  });
  const user = get('SELECT * FROM users WHERE id = ?', req.user.id);
  return sendData(res, { user: mePayload(user) });
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = get('SELECT * FROM users WHERE id = ?', req.user.id);
  const valid = await verifyPassword(req.body.currentPassword, user.password_hash);
  if (!valid) throw ApiError.badRequest('Your current password is incorrect.');
  const hash = await hashPassword(req.body.newPassword);
  run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', hash, nowIso(), user.id);
  run(
    'UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND id != ?',
    nowIso(),
    user.id,
    req.user.sessionId,
  );
  return sendData(res, { success: true, message: 'Password updated. Other devices have been signed out.' });
});

export const listSessions = asyncHandler(async (req, res) => {
  const sessions = all(
    `SELECT id, user_agent, ip, created_at, last_seen_at
     FROM sessions WHERE user_id = ? AND revoked_at IS NULL ORDER BY last_seen_at DESC`,
    req.user.id,
  );
  return sendData(res, {
    sessions: sessions.map((s) => ({
      id: s.id,
      userAgent: s.user_agent,
      ip: s.ip,
      createdAt: s.created_at,
      lastSeenAt: s.last_seen_at,
      current: s.id === req.user.sessionId,
    })),
  });
});

export const revokeSession = asyncHandler(async (req, res) => {
  const session = get(
    'SELECT * FROM sessions WHERE id = ? AND user_id = ?',
    req.params.id,
    req.user.id,
  );
  if (!session) throw ApiError.notFound('Session not found.');
  if (session.id === req.user.sessionId) {
    throw ApiError.badRequest('Use sign out to end your current session.');
  }
  run('UPDATE sessions SET revoked_at = ? WHERE id = ?', nowIso(), session.id);
  return sendData(res, { success: true });
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().regex(EMAIL_RE),
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = get('SELECT id, email FROM users WHERE email = ? AND deleted_at IS NULL', req.body.email);
  if (user) {
    const token = randomToken(32);
    run(
      `INSERT INTO password_resets (id, user_id, token_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      user.id,
      hashToken(token),
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      nowIso(),
    );
    // Email delivery requires SMTP credentials; the token is never returned by the API.
  }
  return sendData(res, {
    message: env.integrations.smtp
      ? 'If an account exists for that email, a reset link has been sent.'
      : 'Email delivery is not configured on this deployment, so reset links cannot be sent. Please contact an administrator to reset your password securely.',
    emailConfigured: env.integrations.smtp,
  });
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: passwordSchema,
});

export const resetPassword = asyncHandler(async (req, res) => {
  const row = get(
    `SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?`,
    hashToken(req.body.token),
    nowIso(),
  );
  if (!row) throw ApiError.badRequest('This reset link is invalid or has expired.');
  const hash = await hashPassword(req.body.password);
  transaction(() => {
    run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', hash, nowIso(), row.user_id);
    run('UPDATE password_resets SET used_at = ? WHERE id = ?', nowIso(), row.id);
    run('UPDATE sessions SET revoked_at = ? WHERE user_id = ?', nowIso(), row.user_id);
  });
  return sendData(res, { success: true, message: 'Password reset. You can sign in with your new password.' });
});

export const updateNotificationPrefs = asyncHandler(async (req, res) => {
  const prefs = {
    inApp: Boolean(req.body.inApp),
    email: Boolean(req.body.email),
    push: Boolean(req.body.push),
  };
  run(
    'UPDATE users SET notification_prefs = ?, updated_at = ? WHERE id = ?',
    JSON.stringify(prefs),
    nowIso(),
    req.user.id,
  );
  return sendData(res, {
    prefs,
    notice: prefs.email && !env.integrations.smtp
      ? 'Email notifications are saved but email delivery is not configured on this deployment.'
      : null,
  });
});

export const getNotificationPrefs = asyncHandler(async (req, res) => {
  const prefs = parseJson(req.user.notification_prefs, { inApp: true, email: false, push: false });
  return sendData(res, { prefs, emailConfigured: env.integrations.smtp });
});
