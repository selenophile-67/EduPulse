import crypto from 'node:crypto';
import { z } from 'zod';
import { all, get, run } from '../config/db.js';
import { COURSE_SELECT, SORT_OPTIONS } from '../models/courses.js';
import { mapCourse, mapLecture, mapLiveClass } from '../models/serialize.js';
import { parsePagination, paginated, nowIso, parseJson } from '../utils/misc.js';
import { asyncHandler, ApiError, sendData } from '../utils/http.js';
import { getEnrollment, hasCourseAccess } from '../services/access.service.js';
import { createNotification } from '../services/notification.service.js';

export const listCourses = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { q, category, exam, level, language, price, sort = 'popular', teacher, classLevel, minRating } = req.query;

  const where = [`c.status = 'published'`, `c.deleted_at IS NULL`];
  const params = [];
  if (q) {
    const term = `%${String(q).trim()}%`;
    where.push(`(c.title LIKE ? OR c.subtitle LIKE ? OR c.exam LIKE ? OR c.category LIKE ? OR c.description LIKE ? OR u.name LIKE ?)`);
    params.push(term, term, term, term, term, term);
  }
  if (category) {
    where.push('c.category = ?');
    params.push(category);
  }
  if (exam) {
    where.push('c.exam = ?');
    params.push(exam);
  }
  if (classLevel) {
    where.push('c.class_level = ?');
    params.push(classLevel);
  }
  if (level) {
    where.push('c.level = ?');
    params.push(level);
  }
  if (language) {
    where.push('c.language = ?');
    params.push(language);
  }
  if (teacher) {
    where.push('c.teacher_id = ?');
    params.push(teacher);
  }
  if (price === 'free') where.push('c.price_cents = 0');
  if (price === 'paid') where.push('c.price_cents > 0');

  const order = SORT_OPTIONS[sort] || SORT_OPTIONS.popular;
  const base = `${COURSE_SELECT} WHERE ${where.join(' AND ')}`;
  let items = all(`${base} ORDER BY ${order} LIMIT ? OFFSET ?`, ...params, limit, offset).map(mapCourse);
  if (minRating) {
    items = items.filter((c) => (c.rating.average || 0) >= Number(minRating));
  }
  const total = get(`SELECT COUNT(*) AS count FROM courses c JOIN users u ON u.id = c.teacher_id WHERE ${where.join(' AND ')}`, ...params);

  if (req.user) {
    const enrolled = new Set(
      all(
        `SELECT course_id FROM enrollments WHERE user_id = ? AND status = 'active'
         AND (expires_at IS NULL OR expires_at > ?)`,
        req.user.id,
        nowIso(),
      ).map((row) => row.course_id),
    );
    items = items.map((course) => ({ ...course, enrolled: enrolled.has(course.id) }));
  }

  return sendData(res, paginated(items, total?.count ?? 0, page, limit));
});

export const courseFilters = asyncHandler(async (_req, res) => {
  const categories = all(
    `SELECT cat.slug, cat.name, cat.tagline, cat.icon, cat.accent,
      (SELECT COUNT(*) FROM courses c WHERE c.category = cat.slug AND c.status = 'published' AND c.deleted_at IS NULL) AS course_count,
      (SELECT MIN(c.price_cents) FROM courses c WHERE c.category = cat.slug AND c.status = 'published' AND c.deleted_at IS NULL) AS min_price
     FROM categories cat ORDER BY cat.position ASC`,
  );
  const exams = all(
    `SELECT exam, COUNT(*) AS course_count FROM courses
     WHERE status = 'published' AND deleted_at IS NULL GROUP BY exam ORDER BY course_count DESC`,
  );
  const languages = all(
    `SELECT language, COUNT(*) AS course_count FROM courses
     WHERE status = 'published' AND deleted_at IS NULL GROUP BY language ORDER BY course_count DESC`,
  );
  const levels = all(
    `SELECT level, COUNT(*) AS course_count FROM courses
     WHERE status = 'published' AND deleted_at IS NULL GROUP BY level`,
  );
  return sendData(res, { categories, exams, languages, levels });
});

function reviewSummary(courseId) {
  const summary = get(
    `SELECT ROUND(AVG(rating), 1) AS average, COUNT(*) AS total FROM reviews WHERE course_id = ?`,
    courseId,
  );
  const distribution = all(
    `SELECT rating, COUNT(*) AS count FROM reviews WHERE course_id = ? GROUP BY rating ORDER BY rating DESC`,
    courseId,
  );
  return {
    average: summary?.average ? Number(summary.average) : null,
    total: summary?.total ?? 0,
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: distribution.find((d) => d.rating === rating)?.count ?? 0,
    })),
  };
}

export const courseDetails = asyncHandler(async (req, res) => {
  const row = get(`${COURSE_SELECT} WHERE c.slug = ? AND c.deleted_at IS NULL`, req.params.slug);
  if (!row) throw ApiError.notFound('This course does not exist or has been removed.');
  const isOwner = req.user && (req.user.role === 'admin' || req.user.id === row.teacher_id);
  if (row.status !== 'published' && !isOwner) {
    throw ApiError.notFound('This course is not published yet.');
  }

  const access = hasCourseAccess(req.user, row.id);
  const enrollment = req.user ? getEnrollment(req.user.id, row.id) : null;
  const teacher = get(
    `SELECT u.id, u.name, u.avatar_color, tp.headline, tp.qualification, tp.experience_years, tp.subjects, tp.bio,
      (SELECT COUNT(*) FROM courses c2 WHERE c2.teacher_id = u.id AND c2.status = 'published' AND c2.deleted_at IS NULL) AS course_count,
      (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e JOIN courses c2 ON c2.id = e.course_id
        WHERE c2.teacher_id = u.id AND e.status = 'active') AS student_count
     FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id WHERE u.id = ?`,
    row.teacher_id,
  );

  const subjects = all('SELECT * FROM subjects WHERE course_id = ? ORDER BY position', row.id);
  const chapters = all('SELECT * FROM chapters WHERE course_id = ? ORDER BY position', row.id);
  const lectureRows = all('SELECT * FROM lectures WHERE course_id = ? ORDER BY position', row.id);
  const progressRows = req.user
    ? all(
        `SELECT lp.* FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
         WHERE l.course_id = ? AND lp.user_id = ?`,
        row.id,
        req.user.id,
      )
    : [];
  const progressMap = new Map(progressRows.map((p) => [p.lecture_id, p]));

  const curriculum = subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    chapters: chapters
      .filter((ch) => ch.subject_id === subject.id)
      .map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        lectures: lectureRows
          .filter((l) => l.chapter_id === chapter.id)
          .map((l) => {
            const progress = progressMap.get(l.id);
            return {
              ...mapLecture({
                ...l,
                completed: progress?.completed,
                position_seconds: progress?.position_seconds,
              }),
              locked: !access && !l.is_preview,
            };
          }),
      })),
  }));

  const tests = all(
    `SELECT t.*,
      (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
     FROM tests t WHERE t.course_id = ? AND t.status = 'published' ORDER BY t.created_at DESC`,
    row.id,
  ).map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    durationMinutes: t.duration_minutes,
    totalMarks: t.total_marks,
    questionCount: t.question_count,
    attemptCount: t.attempt_count,
  }));

  const upcomingLive = all(
    `SELECT lc.*, c.title AS course_title, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
      (SELECT COUNT(*) FROM attendance a WHERE a.live_class_id = lc.id) AS attendee_count
     FROM live_classes lc JOIN users u ON u.id = lc.teacher_id LEFT JOIN courses c ON c.id = lc.course_id
     WHERE lc.course_id = ? AND lc.status = 'scheduled' AND lc.scheduled_end > ?
     ORDER BY lc.scheduled_start LIMIT 4`,
    row.id,
    nowIso(),
  ).map(mapLiveClass);

  const reviews = all(
    `SELECT r.*, u.name, u.avatar_color FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.course_id = ? ORDER BY r.created_at DESC LIMIT 6`,
    row.id,
  ).map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.created_at,
    studentName: r.name,
    avatarColor: r.avatar_color,
  }));

  const related = all(
    `${COURSE_SELECT} WHERE c.category = ? AND c.id != ? AND c.status = 'published' AND c.deleted_at IS NULL
     ORDER BY enrolled_count DESC LIMIT 3`,
    row.category,
    row.id,
  ).map(mapCourse);

  return sendData(res, {
    course: mapCourse(row),
    teacher: {
      id: teacher?.id,
      name: teacher?.name,
      avatarColor: teacher?.avatar_color,
      headline: teacher?.headline,
      qualification: teacher?.qualification,
      experienceYears: teacher?.experience_years,
      subjects: teacher?.subjects,
      bio: teacher?.bio,
      courseCount: teacher?.course_count ?? 0,
      studentCount: teacher?.student_count ?? 0,
    },
    access: {
      hasAccess: access,
      isOwner: Boolean(isOwner),
      enrolledAt: enrollment?.enrolled_at || null,
      expiresAt: enrollment?.expires_at || null,
      requiresPurchase: row.price_cents > 0,
    },
    curriculum,
    tests,
    upcomingLive,
    reviews: { summary: reviewSummary(row.id), items: reviews },
    related,
    totals: {
      lectures: lectureRows.length,
      previewLectures: lectureRows.filter((l) => l.is_preview).length,
      durationSeconds: lectureRows.reduce((sum, l) => sum + l.duration_seconds, 0),
    },
  });
});

export const listReviews = asyncHandler(async (req, res) => {
  const course = get('SELECT id FROM courses WHERE slug = ?', req.params.slug);
  if (!course) throw ApiError.notFound('Course not found.');
  const { page, limit, offset } = parsePagination(req.query, { limit: 10 });
  const items = all(
    `SELECT r.*, u.name, u.avatar_color FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.course_id = ? ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    course.id,
    limit,
    offset,
  ).map((r) => ({
    id: r.id,
    rating: r.rating,
    body: r.body,
    createdAt: r.created_at,
    studentName: r.name,
    avatarColor: r.avatar_color,
  }));
  const total = get('SELECT COUNT(*) AS count FROM reviews WHERE course_id = ?', course.id);
  return sendData(res, { ...paginated(items, total?.count ?? 0, page, limit), summary: reviewSummary(course.id) });
});

export const upsertReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().max(1000).optional().default(''),
});

export const upsertReview = asyncHandler(async (req, res) => {
  const course = get('SELECT * FROM courses WHERE slug = ?', req.params.slug);
  if (!course) throw ApiError.notFound('Course not found.');
  const enrollment = getEnrollment(req.user.id, course.id);
  if (!enrollment) throw ApiError.forbidden('Only enrolled students can review this course.');
  const existing = get('SELECT id FROM reviews WHERE course_id = ? AND user_id = ?', course.id, req.user.id);
  if (existing) {
    run('UPDATE reviews SET rating = ?, body = ?, created_at = ? WHERE id = ?', req.body.rating, req.body.body, nowIso(), existing.id);
  } else {
    run(
      'INSERT INTO reviews (id, course_id, user_id, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      crypto.randomUUID(),
      course.id,
      req.user.id,
      req.body.rating,
      req.body.body,
      nowIso(),
    );
    createNotification(course.teacher_id, {
      type: 'review',
      title: 'New course review',
      body: `${req.user.name} rated ${course.title} ${req.body.rating}/5.`,
      link: `/teacher/courses/${course.id}`,
    });
  }
  return sendData(res, { summary: reviewSummary(course.id), updated: Boolean(existing) });
});

export const enrollCourse = asyncHandler(async (req, res) => {
  const courseId = req.body.courseId;
  const course = get('SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL', courseId);
  if (!course) throw ApiError.notFound('Course not found.');
  if (course.status !== 'published') throw ApiError.badRequest('This course is not open for enrollment yet.');

  const existing = get('SELECT * FROM enrollments WHERE user_id = ? AND course_id = ?', req.user.id, courseId);
  if (existing && existing.status === 'active' && (!existing.expires_at || existing.expires_at > nowIso())) {
    return sendData(res, { enrollment: existing, alreadyEnrolled: true });
  }

  if (course.price_cents > 0) {
    throw ApiError.paymentRequired(
      `"${course.title}" is a paid course (₹${Math.round(course.price_cents / 100)}). Online payments are not configured on this deployment yet, so paid enrollment cannot be completed. Free courses and free tests remain fully available.`,
    );
  }

  const enrolledAt = nowIso();
  const expiresAt = new Date(Date.now() + course.validity_days * 24 * 60 * 60 * 1000).toISOString();
  const enrollmentId = existing?.id || crypto.randomUUID();
  if (existing) {
    run(
      `UPDATE enrollments SET status = 'active', enrolled_at = ?, expires_at = ? WHERE id = ?`,
      enrolledAt,
      expiresAt,
      existing.id,
    );
  } else {
    run(
      `INSERT INTO enrollments (id, user_id, course_id, status, enrolled_at, expires_at)
       VALUES (?, ?, ?, 'active', ?, ?)`,
      enrollmentId,
      req.user.id,
      courseId,
      enrolledAt,
      expiresAt,
    );
  }
  createNotification(req.user.id, {
    type: 'enrollment',
    title: `You're enrolled in ${course.title}`,
    body: 'Your course access is active. Start with the first lecture in My Learning.',
    link: `/dashboard/courses/${course.id}`,
  });
  createNotification(course.teacher_id, {
    type: 'enrollment',
    title: 'New student enrolled',
    body: `${req.user.name} joined ${course.title}.`,
    link: `/teacher/courses/${course.id}`,
  });
  return sendData(
    res,
    {
      enrollment: get('SELECT * FROM enrollments WHERE id = ?', enrollmentId),
      alreadyEnrolled: false,
    },
    201,
  );
});

export const myEnrollments = asyncHandler(async (req, res) => {
  const rows = all(
    `SELECT e.*, c.title, c.slug, c.exam, c.category, c.thumbnail_theme,
      u.name AS teacher_name
     FROM enrollments e JOIN courses c ON c.id = e.course_id JOIN users u ON u.id = c.teacher_id
     WHERE e.user_id = ? AND e.status = 'active' ORDER BY e.enrolled_at DESC`,
    req.user.id,
  );
  return sendData(res, {
    enrollments: rows.map((r) => ({
      id: r.id,
      courseId: r.course_id,
      courseTitle: r.title,
      slug: r.slug,
      exam: r.exam,
      theme: r.thumbnail_theme || r.category,
      teacherName: r.teacher_name,
      enrolledAt: r.enrolled_at,
      expiresAt: r.expires_at,
    })),
  });
});

export const courseCategories = asyncHandler(async (_req, res) => {
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
  return sendData(res, { categories });
});

export const featuredCourses = asyncHandler(async (_req, res) => {
  const popular = all(
    `${COURSE_SELECT} WHERE c.status = 'published' AND c.deleted_at IS NULL
     ORDER BY enrolled_count DESC, rating_avg DESC LIMIT 6`,
  ).map(mapCourse);
  const newest = all(
    `${COURSE_SELECT} WHERE c.status = 'published' AND c.deleted_at IS NULL
     ORDER BY c.created_at DESC LIMIT 4`,
  ).map(mapCourse);
  const free = all(
    `${COURSE_SELECT} WHERE c.status = 'published' AND c.deleted_at IS NULL AND c.price_cents = 0
     ORDER BY enrolled_count DESC LIMIT 4`,
  ).map(mapCourse);
  return sendData(res, { popular, newest, free });
});

export const bookmarkSchema = z.object({
  entityType: z.enum(['lecture', 'material', 'test', 'course']),
  entityId: z.string().min(1),
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.body;
  const existing = get(
    'SELECT id FROM bookmarks WHERE user_id = ? AND entity_type = ? AND entity_id = ?',
    req.user.id,
    entityType,
    entityId,
  );
  if (existing) {
    run('DELETE FROM bookmarks WHERE id = ?', existing.id);
    return sendData(res, { bookmarked: false });
  }
  run(
    'INSERT INTO bookmarks (id, user_id, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?, ?)',
    crypto.randomUUID(),
    req.user.id,
    entityType,
    entityId,
    nowIso(),
  );
  return sendData(res, { bookmarked: true }, 201);
});

export const listBookmarks = asyncHandler(async (req, res) => {
  const rows = all(
    'SELECT * FROM bookmarks WHERE user_id = ? ORDER BY created_at DESC',
    req.user.id,
  );
  const items = rows
    .map((b) => {
      if (b.entity_type === 'lecture') {
        const lecture = get(
          `SELECT l.id, l.title, l.duration_seconds, c.title AS course_title, c.id AS course_id
           FROM lectures l JOIN courses c ON c.id = l.course_id WHERE l.id = ?`,
          b.entity_id,
        );
        return lecture
          ? { id: b.id, entityType: 'lecture', entityId: b.entity_id, title: lecture.title, subtitle: lecture.course_title, link: `/dashboard/lectures/${lecture.id}`, createdAt: b.created_at }
          : null;
      }
      if (b.entity_type === 'material') {
        const material = get('SELECT id, title, exam FROM study_materials WHERE id = ?', b.entity_id);
        return material
          ? { id: b.id, entityType: 'material', entityId: b.entity_id, title: material.title, subtitle: material.exam, link: `/materials?highlight=${material.id}`, createdAt: b.created_at }
          : null;
      }
      if (b.entity_type === 'test') {
        const test = get('SELECT id, title, exam FROM tests WHERE id = ?', b.entity_id);
        return test
          ? { id: b.id, entityType: 'test', entityId: b.entity_id, title: test.title, subtitle: test.exam, link: `/tests/${test.id}`, createdAt: b.created_at }
          : null;
      }
      const course = get('SELECT id, slug, title, exam FROM courses WHERE id = ?', b.entity_id);
      return course
        ? { id: b.id, entityType: 'course', entityId: b.entity_id, title: course.title, subtitle: course.exam, link: `/courses/${course.slug}`, createdAt: b.created_at }
        : null;
    })
    .filter(Boolean);
  return sendData(res, { bookmarks: items });
});
