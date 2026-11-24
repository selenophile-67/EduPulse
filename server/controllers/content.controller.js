import crypto from 'node:crypto';
import { z } from 'zod';
import { all, get, run } from '../config/db.js';
import { env } from '../config/env.js';
import { COURSE_SELECT } from '../models/courses.js';
import { mapCourse, mapMaterial, mapLiveClass } from '../models/serialize.js';
import { nowIso } from '../utils/misc.js';
import { asyncHandler, sendData, ApiError } from '../utils/http.js';
import { createNotification } from '../services/notification.service.js';

export const homeContent = asyncHandler(async (_req, res) => {
  const stats = get(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'student' AND deleted_at IS NULL) AS students,
      (SELECT COUNT(*) FROM courses WHERE status = 'published' AND deleted_at IS NULL) AS courses,
      (SELECT COUNT(*) FROM lectures l JOIN courses c ON c.id = l.course_id WHERE c.status = 'published') AS lectures,
      (SELECT COUNT(*) FROM tests WHERE status = 'published') AS tests,
      (SELECT COUNT(*) FROM questions) AS questions,
      (SELECT ROUND(AVG(rating), 1) FROM reviews) AS avg_rating,
      (SELECT COUNT(*) FROM reviews) AS reviews,
      (SELECT COUNT(*) FROM study_materials) AS materials
    `,
  );

  const banners = all('SELECT * FROM banners WHERE active = 1 ORDER BY position').map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    ctaLabel: b.cta_label,
    ctaLink: b.cta_link,
    theme: b.theme,
  }));

  const categories = all(
    `SELECT cat.*,
      (SELECT COUNT(*) FROM courses c WHERE c.category = cat.slug AND c.status = 'published' AND c.deleted_at IS NULL) AS course_count,
      (SELECT MIN(c.price_cents) FROM courses c WHERE c.category = cat.slug AND c.status = 'published' AND c.deleted_at IS NULL) AS min_price
     FROM categories cat ORDER BY cat.position`,
  ).map((c) => ({
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    description: c.description,
    icon: c.icon,
    accent: c.accent,
    courseCount: c.course_count,
    fromPriceCents: c.min_price,
  }));

  const popular = all(
    `${COURSE_SELECT} WHERE c.status = 'published' AND c.deleted_at IS NULL
     ORDER BY rating_avg DESC, enrolled_count DESC LIMIT 6`,
  ).map(mapCourse);

  const bestsellers = all(
    `${COURSE_SELECT} WHERE c.status = 'published' AND c.deleted_at IS NULL
     ORDER BY enrolled_count DESC LIMIT 4`,
  ).map(mapCourse);

  const upcomingLive = all(
    `SELECT lc.*, c.title AS course_title, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
      (SELECT COUNT(*) FROM attendance a WHERE a.live_class_id = lc.id) AS attendee_count
     FROM live_classes lc LEFT JOIN courses c ON c.id = lc.course_id
     JOIN users u ON u.id = lc.teacher_id
     WHERE lc.status = 'scheduled' AND lc.scheduled_end > ? ORDER BY lc.scheduled_start LIMIT 4`,
    nowIso(),
  ).map(mapLiveClass);

  const freeResources = all(
    `SELECT m.*, c.title AS course_title FROM study_materials m LEFT JOIN courses c ON c.id = m.course_id
     WHERE m.is_premium = 0 ORDER BY m.download_count DESC LIMIT 6`,
  ).map((m) => mapMaterial(m));

  const recentLectures = all(
    `SELECT l.id, l.title, l.duration_seconds, l.created_at, l.is_preview,
      c.title AS course_title, c.slug AS course_slug, c.thumbnail_theme, c.category
     FROM lectures l JOIN courses c ON c.id = l.course_id
     WHERE c.status = 'published' ORDER BY l.created_at DESC LIMIT 5`,
  ).map((l) => ({
    id: l.id,
    title: l.title,
    durationSeconds: l.duration_seconds,
    createdAt: l.created_at,
    isPreview: Boolean(l.is_preview),
    courseTitle: l.course_title,
    courseSlug: l.course_slug,
    theme: l.thumbnail_theme || l.category,
  }));

  const topEducators = all(
    `SELECT u.id, u.name, u.avatar_color, tp.headline, tp.qualification, tp.experience_years, tp.subjects,
      (SELECT COUNT(*) FROM courses c WHERE c.teacher_id = u.id AND c.status = 'published' AND c.deleted_at IS NULL) AS course_count,
      (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.teacher_id = u.id) AS student_count,
      (SELECT ROUND(AVG(r.rating), 1) FROM reviews r JOIN courses c ON c.id = r.course_id WHERE c.teacher_id = u.id) AS rating_avg
     FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE u.role = 'teacher' AND u.deleted_at IS NULL AND u.status = 'active'
     ORDER BY student_count DESC LIMIT 5`,
  ).map((e) => ({
    id: e.id,
    name: e.name,
    avatarColor: e.avatar_color,
    headline: e.headline,
    qualification: e.qualification,
    experienceYears: e.experience_years,
    subjects: e.subjects,
    courseCount: e.course_count,
    studentCount: e.student_count,
    ratingAvg: e.rating_avg,
  }));

  const achievements = all(
    `SELECT u.name, u.avatar_color, t.title AS test_title, t.exam, r.score, r.max_marks, r.rank, r.percentile, r.created_at
     FROM results r JOIN users u ON u.id = r.user_id JOIN tests t ON t.id = r.test_id
     WHERE r.max_marks > 0 ORDER BY (r.score * 1.0 / r.max_marks) DESC LIMIT 5`,
  ).map((r) => ({
    studentName: r.name,
    avatarColor: r.avatar_color,
    testTitle: r.test_title,
    exam: r.exam,
    score: r.score,
    maxMarks: r.max_marks,
    percent: Math.round((r.score / r.max_marks) * 1000) / 10,
    rank: r.rank,
    percentile: r.percentile,
    date: r.created_at,
  }));

  const successStories = all(
    `SELECT r.rating, r.body, r.created_at, u.name, u.avatar_color, c.title AS course_title, c.exam, u.id AS user_id
     FROM reviews r JOIN users u ON u.id = r.user_id JOIN courses c ON c.id = r.course_id
     WHERE r.rating = 5 AND r.body IS NOT NULL AND LENGTH(r.body) > 50
     ORDER BY r.created_at DESC LIMIT 6`,
  ).map((r) => ({
    studentName: r.name,
    avatarColor: r.avatar_color,
    courseTitle: r.course_title,
    exam: r.exam,
    rating: r.rating,
    body: r.body,
    date: r.created_at,
  }));

  const testimonials = all(
    `SELECT r.rating, r.body, u.name, u.avatar_color, c.title AS course_title, c.exam
     FROM reviews r JOIN users u ON u.id = r.user_id JOIN courses c ON c.id = r.course_id
     WHERE r.rating >= 4 AND r.body IS NOT NULL AND LENGTH(r.body) > 30
     ORDER BY r.created_at DESC LIMIT 6`,
  ).map((r) => ({
    studentName: r.name,
    avatarColor: r.avatar_color,
    courseTitle: r.course_title,
    exam: r.exam,
    rating: r.rating,
    body: r.body,
  }));

  const faqs = all('SELECT * FROM faqs ORDER BY position LIMIT 8').map((f) => ({
    id: f.id,
    question: f.question,
    answer: f.answer,
    category: f.category,
  }));

  return sendData(res, {
    stats: {
      students: stats?.students ?? 0,
      courses: stats?.courses ?? 0,
      lectures: stats?.lectures ?? 0,
      tests: stats?.tests ?? 0,
      questions: stats?.questions ?? 0,
      avgRating: stats?.avg_rating ? Number(stats.avg_rating) : null,
      reviews: stats?.reviews ?? 0,
      materials: stats?.materials ?? 0,
    },
    banners,
    categories,
    popular,
    bestsellers,
    upcomingLive,
    freeResources,
    recentLectures,
    topEducators,
    achievements,
    successStories,
    testimonials,
    faqs,
    integrations: {
      ...env.integrations,
      paymentNote: 'Paid enrollments are disabled until a payment gateway is configured.',
    },
  });
});

export const faqs = asyncHandler(async (_req, res) => {
  const rows = all('SELECT * FROM faqs ORDER BY position');
  return sendData(res, { faqs: rows });
});

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const existing = get('SELECT id FROM newsletter_subscribers WHERE email = ?', req.body.email);
  if (!existing) {
    run(
      'INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)',
      crypto.randomUUID(),
      req.body.email,
      nowIso(),
    );
  }
  return sendData(res, {
    subscribed: true,
    message: existing ? 'You are already subscribed to the EduPulse newsletter.' : 'Subscribed. Look out for weekly study tips and exam updates.',
  });
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  subject: z.string().trim().max(120).optional().default('General enquiry'),
  message: z.string().trim().min(10, 'Please share a few more details').max(2000),
});

export const contact = asyncHandler(async (req, res) => {
  run(
    `INSERT INTO contact_messages (id, name, email, subject, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'new', ?)`,
    crypto.randomUUID(),
    req.body.name,
    req.body.email,
    req.body.subject,
    req.body.message,
    nowIso(),
  );
  const admins = all(`SELECT id FROM users WHERE role = 'admin' AND deleted_at IS NULL`);
  for (const admin of admins) {
    createNotification(admin.id, {
      type: 'contact',
      title: 'New contact message',
      body: `${req.body.name}: ${req.body.subject}`,
      link: '/admin/messages',
    });
  }
  return sendData(res, { success: true, message: 'Thanks for reaching out. Our team replies within one working day.' }, 201);
});

export const configStatus = asyncHandler(async (_req, res) => {
  return sendData(res, {
    integrations: env.integrations,
    environment: env.nodeEnv,
    notes: {
      payments: env.integrations.razorpay
        ? 'Payment credentials detected. Stage 2 checkout is not part of this build yet.'
        : 'No payment gateway configured. Paid courses cannot be purchased; free courses work end to end.',
      liveStreaming: env.integrations.livekit
        ? 'LiveKit credentials detected.'
        : 'Live streaming is not configured. Classes can be scheduled and attendance tracked.',
      email: env.integrations.smtp
        ? 'SMTP configured.'
        : 'Email delivery is not configured. Password resets are handled by an administrator.',
      ai: env.integrations.llm ? 'LLM credentials detected.' : 'AI tutor is a Stage 2 module and is not enabled in this build.',
    },
  });
});

export const appHealth = asyncHandler(async (_req, res) => {
  const counts = get(
    `SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM courses) AS courses,
      (SELECT COUNT(*) FROM lectures) AS lectures,
      (SELECT COUNT(*) FROM tests) AS tests
    `,
  );
  return sendData(res, {
    status: 'ok',
    time: nowIso(),
    uptimeSeconds: Math.round(process.uptime()),
    counts,
    integrations: env.integrations,
  });
});
