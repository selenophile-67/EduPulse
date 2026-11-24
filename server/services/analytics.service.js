import os from 'node:os';
import { all, get } from '../config/db.js';
import { env } from '../config/env.js';
import { nowIso, parseJson } from '../utils/misc.js';
import { mapLiveClass, mapTest } from '../models/serialize.js';

const ACTIVE_ENROLLMENT = `e.status = 'active' AND (e.expires_at IS NULL OR e.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ','now'))`;

export function studentDashboard(userId) {
  const enrollments = all(
    `SELECT e.id AS enrollment_id, e.enrolled_at, e.expires_at,
      c.id, c.slug, c.title, c.exam, c.category, c.thumbnail_theme, c.language, c.level,
      u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
      (SELECT COUNT(*) FROM lectures l WHERE l.course_id = c.id) AS lecture_count,
      (SELECT COUNT(*) FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
        WHERE l.course_id = c.id AND lp.user_id = e.user_id AND lp.completed = 1) AS completed_count,
      (SELECT MIN(lc.scheduled_start) FROM live_classes lc
        WHERE lc.course_id = c.id AND lc.status = 'scheduled' AND lc.scheduled_start > ?) AS next_live_at
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN users u ON u.id = c.teacher_id
     WHERE e.user_id = ? AND ${ACTIVE_ENROLLMENT} AND c.deleted_at IS NULL
     ORDER BY e.enrolled_at DESC`,
    nowIso(),
    userId,
  ).map((row) => ({
    enrollmentId: row.enrollment_id,
    enrolledAt: row.enrolled_at,
    expiresAt: row.expires_at,
    course: {
      id: row.id,
      slug: row.slug,
      title: row.title,
      exam: row.exam,
      category: row.category,
      theme: row.thumbnail_theme || row.category,
      language: row.language,
      level: row.level,
      teacherName: row.teacher_name,
      teacherAvatarColor: row.teacher_avatar_color,
    },
    lectureCount: row.lecture_count,
    completedCount: row.completed_count,
    progressPercent: row.lecture_count ? Math.round((row.completed_count / row.lecture_count) * 100) : 0,
    nextLiveAt: row.next_live_at,
  }));

  const courseIds = enrollments.map((e) => e.course.id);
  const placeholders = courseIds.length ? courseIds.map(() => '?').join(',') : null;

  const upcomingLive = placeholders
    ? all(
        `SELECT lc.*, c.title AS course_title, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
          (SELECT COUNT(*) FROM attendance a WHERE a.live_class_id = lc.id) AS attendee_count
         FROM live_classes lc
         LEFT JOIN courses c ON c.id = lc.course_id
         JOIN users u ON u.id = lc.teacher_id
         WHERE lc.status = 'scheduled' AND lc.scheduled_end > ?
         AND (lc.course_id IS NULL OR lc.course_id IN (${placeholders}))
         ORDER BY lc.scheduled_start ASC LIMIT 5`,
        nowIso(),
        ...courseIds,
      ).map(mapLiveClass)
    : all(
        `SELECT lc.*, c.title AS course_title, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
          (SELECT COUNT(*) FROM attendance a WHERE a.live_class_id = lc.id) AS attendee_count
         FROM live_classes lc
         LEFT JOIN courses c ON c.id = lc.course_id
         JOIN users u ON u.id = lc.teacher_id
         WHERE lc.status = 'scheduled' AND lc.scheduled_end > ? AND lc.course_id IS NULL
         ORDER BY lc.scheduled_start ASC LIMIT 5`,
        nowIso(),
      ).map(mapLiveClass);

  const availableTests = placeholders
    ? all(
        `SELECT t.*, c.title AS course_title,
          (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
          (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
         FROM tests t LEFT JOIN courses c ON c.id = t.course_id
         WHERE t.status = 'published' AND (t.end_at IS NULL OR t.end_at > ?)
         AND (t.course_id IS NULL OR t.course_id IN (${placeholders}))
         ORDER BY t.created_at DESC LIMIT 4`,
        nowIso(),
        ...courseIds,
      ).map(mapTest)
    : all(
        `SELECT t.*, c.title AS course_title,
          (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
          (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
         FROM tests t LEFT JOIN courses c ON c.id = t.course_id
         WHERE t.status = 'published' AND t.course_id IS NULL AND (t.end_at IS NULL OR t.end_at > ?)
         ORDER BY t.created_at DESC LIMIT 4`,
        nowIso(),
      ).map(mapTest);

  const recentResults = all(
    `SELECT r.id, r.score, r.max_marks, r.accuracy, r.rank, r.percentile, r.created_at,
      t.title AS test_title, t.exam
     FROM results r JOIN tests t ON t.id = r.test_id
     WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 3`,
    userId,
  ).map((r) => ({
    id: r.id,
    score: r.score,
    maxMarks: r.max_marks,
    accuracy: r.accuracy,
    rank: r.rank,
    percentile: r.percentile,
    createdAt: r.created_at,
    testTitle: r.test_title,
    exam: r.exam,
  }));

  const aggregate = get(
    `SELECT
      (SELECT COUNT(*) FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
        JOIN courses c ON c.id = l.course_id
        WHERE lp.user_id = ? AND lp.completed = 1) AS lectures_completed,
      (SELECT COALESCE(SUM(lp.position_seconds), 0) FROM lecture_progress lp WHERE lp.user_id = ?) AS watch_seconds,
      (SELECT COUNT(*) FROM test_attempts WHERE user_id = ? AND status != 'in_progress') AS tests_taken,
      (SELECT ROUND(AVG(accuracy), 1) FROM results WHERE user_id = ?) AS avg_accuracy
    `,
    userId,
    userId,
    userId,
    userId,
  );

  const heldClasses = placeholders
    ? get(
        `SELECT COUNT(*) AS total FROM live_classes lc
         WHERE lc.scheduled_end < ? AND lc.status != 'cancelled'
         AND (lc.course_id IS NULL OR lc.course_id IN (${placeholders}))`,
        nowIso(),
        ...courseIds,
      )
    : { total: 0 };
  const attended = get(
    `SELECT COUNT(*) AS total FROM attendance a JOIN live_classes lc ON lc.id = a.live_class_id
     WHERE a.user_id = ? AND a.status = 'present' AND lc.status != 'cancelled'`,
    userId,
  );

  const profile = get('SELECT streak_days FROM student_profiles WHERE user_id = ?', userId);

  return {
    enrollments,
    stats: {
      activeCourses: enrollments.length,
      lecturesCompleted: aggregate?.lectures_completed ?? 0,
      watchSeconds: aggregate?.watch_seconds ?? 0,
      testsTaken: aggregate?.tests_taken ?? 0,
      avgAccuracy: aggregate?.avg_accuracy ?? null,
      attendancePercent:
        heldClasses?.total > 0 ? Math.round((Math.min(attended.total, heldClasses.total) / heldClasses.total) * 100) : null,
      streakDays: profile?.streak_days ?? 0,
    },
    upcomingLive,
    availableTests,
    recentResults,
  };
}

export function courseProgress(userId, courseId) {
  return all(
    `SELECT l.id, l.title, l.duration_seconds, l.position, lp.completed, lp.position_seconds, lp.updated_at
     FROM lectures l LEFT JOIN lecture_progress lp
       ON lp.lecture_id = l.id AND lp.user_id = ?
     WHERE l.course_id = ? ORDER BY l.position ASC`,
    userId,
    courseId,
  );
}

export function studentPerformance(userId) {
  const results = all(
    `SELECT r.id, r.score, r.max_marks, r.accuracy, r.rank, r.percentile, r.created_at,
      t.title AS test_title, t.exam, r.subject_breakdown
     FROM results r JOIN tests t ON t.id = r.test_id
     WHERE r.user_id = ? ORDER BY r.created_at ASC LIMIT 20`,
    userId,
  );

  const subjectMap = new Map();
  for (const result of results) {
    for (const subject of parseJson(result.subject_breakdown, [])) {
      if (!subjectMap.has(subject.subject)) {
        subjectMap.set(subject.subject, { subject: subject.subject, correct: 0, incorrect: 0, unattempted: 0, score: 0, maxMarks: 0 });
      }
      const entry = subjectMap.get(subject.subject);
      entry.correct += subject.correct;
      entry.incorrect += subject.incorrect;
      entry.unattempted += subject.unattempted;
      entry.score += subject.score;
      entry.maxMarks += subject.maxMarks;
    }
  }
  const subjects = [...subjectMap.values()].map((s) => ({
    ...s,
    accuracy: s.correct + s.incorrect > 0 ? Math.round((s.correct / (s.correct + s.incorrect)) * 1000) / 10 : 0,
  }));

  const weakSubjects = [...subjects].sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  const strongSubjects = [...subjects].sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);

  const studyTime = get(
    `SELECT COALESCE(SUM(position_seconds), 0) AS seconds,
      COUNT(DISTINCT lecture_id) AS lectures
     FROM lecture_progress WHERE user_id = ?`,
    userId,
  );

  const enrollments = all(
    `SELECT c.id, c.slug, c.title, c.thumbnail_theme,
      (SELECT COUNT(*) FROM lectures l WHERE l.course_id = c.id) AS lecture_count,
      (SELECT COUNT(*) FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
        WHERE l.course_id = c.id AND lp.user_id = e.user_id AND lp.completed = 1) AS completed_count
     FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = ? AND e.status = 'active'`,
    userId,
  ).map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    theme: c.thumbnail_theme,
    lectureCount: c.lecture_count,
    completedCount: c.completed_count,
    progressPercent: c.lecture_count ? Math.round((c.completed_count / c.lecture_count) * 100) : 0,
  }));

  return {
    results: results.map((r) => ({
      id: r.id,
      testTitle: r.test_title,
      exam: r.exam,
      score: r.score,
      maxMarks: r.max_marks,
      percent: r.max_marks ? Math.round((r.score / r.max_marks) * 1000) / 10 : 0,
      accuracy: r.accuracy,
      rank: r.rank,
      percentile: r.percentile,
      createdAt: r.created_at,
    })),
    subjects,
    weakSubjects,
    strongSubjects,
    studyTimeSeconds: studyTime?.seconds ?? 0,
    lecturesWatched: studyTime?.lectures ?? 0,
    enrollments,
  };
}

export function calendar(userId, from, to) {
  const enrolled = all(
    `SELECT course_id FROM enrollments WHERE user_id = ? AND status = 'active'`,
    userId,
  ).map((r) => r.course_id);
  const placeholders = enrolled.length ? enrolled.map(() => '?').join(',') : null;

  const liveClasses = placeholders
    ? all(
        `SELECT lc.*, c.title AS course_title, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
          (SELECT COUNT(*) FROM attendance a WHERE a.live_class_id = lc.id) AS attendee_count
         FROM live_classes lc LEFT JOIN courses c ON c.id = lc.course_id
         JOIN users u ON u.id = lc.teacher_id
         WHERE lc.scheduled_start >= ? AND lc.scheduled_start <= ?
         AND (lc.course_id IS NULL OR lc.course_id IN (${placeholders}))
         ORDER BY lc.scheduled_start`,
        from,
        to,
        ...enrolled,
      )
    : [];
  const tests = placeholders
    ? all(
        `SELECT t.id, t.title, t.exam, t.duration_minutes, t.total_marks, t.start_at, t.created_at
         FROM tests t
         WHERE t.status = 'published' AND COALESCE(t.start_at, t.created_at) >= ? AND COALESCE(t.start_at, t.created_at) <= ?
         AND (t.course_id IS NULL OR t.course_id IN (${placeholders}))
         ORDER BY COALESCE(t.start_at, t.created_at)`,
        from,
        to,
        ...enrolled,
      )
    : [];

  return {
    liveClasses: liveClasses.map(mapLiveClass),
    tests: tests.map((t) => ({
      id: t.id,
      title: t.title,
      exam: t.exam,
      durationMinutes: t.duration_minutes,
      totalMarks: t.total_marks,
      scheduledAt: t.start_at || t.created_at,
    })),
  };
}

export function teacherOverview(teacherId) {
  const courses = all(
    `SELECT c.*, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
      (SELECT COUNT(*) FROM reviews r WHERE r.course_id = c.id) AS rating_count,
      (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.course_id = c.id) AS rating_avg,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') AS enrolled_count,
      (SELECT COUNT(*) FROM lectures l WHERE l.course_id = c.id) AS lecture_count,
      (SELECT COALESCE(SUM(l.duration_seconds), 0) FROM lectures l WHERE l.course_id = c.id) AS total_seconds,
      (SELECT MIN(lc.scheduled_start) FROM live_classes lc
        WHERE lc.course_id = c.id AND lc.status = 'scheduled' AND lc.scheduled_start > ?) AS next_live_at
     FROM courses c JOIN users u ON u.id = c.teacher_id
     WHERE c.teacher_id = ? AND c.deleted_at IS NULL
     ORDER BY c.updated_at DESC`,
    nowIso(),
    teacherId,
  );

  const stats = get(
    `SELECT
      (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e JOIN courses c ON c.id = e.course_id
        WHERE c.teacher_id = ? AND e.status = 'active') AS student_count,
      (SELECT COUNT(*) FROM courses WHERE teacher_id = ? AND status = 'published' AND deleted_at IS NULL) AS published_courses,
      (SELECT COUNT(*) FROM live_classes WHERE teacher_id = ? AND status = 'scheduled' AND scheduled_end > ?) AS upcoming_classes,
      (SELECT COUNT(*) FROM lectures l JOIN courses c ON c.id = l.course_id WHERE c.teacher_id = ?) AS lecture_count,
      (SELECT COUNT(*) FROM tests WHERE created_by = ? AND status = 'published') AS published_tests,
      (SELECT ROUND(AVG(r.accuracy), 1) FROM results r JOIN tests t ON t.id = r.test_id
        WHERE t.created_by = ?) AS avg_accuracy
    `,
    teacherId,
    teacherId,
    teacherId,
    nowIso(),
    teacherId,
    teacherId,
    teacherId,
  );

  const students = all(
    `SELECT u.id, u.name, u.email, u.avatar_color,
      COUNT(DISTINCT e.course_id) AS course_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.user_id = u.id AND a.status != 'in_progress') AS tests_taken,
      (SELECT ROUND(AVG(r.accuracy), 1) FROM results r WHERE r.user_id = u.id) AS avg_accuracy,
      (SELECT MAX(a.submitted_at) FROM test_attempts a WHERE a.user_id = u.id) AS last_active
     FROM enrollments e
     JOIN courses c ON c.id = e.course_id
     JOIN users u ON u.id = e.user_id
     WHERE c.teacher_id = ? AND e.status = 'active'
     GROUP BY u.id ORDER BY last_active DESC NULLS LAST LIMIT 50`,
    teacherId,
  );

  const recentEnrollments = all(
    `SELECT e.enrolled_at, u.name, u.avatar_color, c.title AS course_title, c.id AS course_id
     FROM enrollments e JOIN users u ON u.id = e.user_id JOIN courses c ON c.id = e.course_id
     WHERE c.teacher_id = ? ORDER BY e.enrolled_at DESC LIMIT 8`,
    teacherId,
  );

  const upcoming = all(
    `SELECT lc.*, c.title AS course_title, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
      (SELECT COUNT(*) FROM attendance a WHERE a.live_class_id = lc.id) AS attendee_count
     FROM live_classes lc LEFT JOIN courses c ON c.id = lc.course_id
     JOIN users u ON u.id = lc.teacher_id
     WHERE lc.teacher_id = ? AND lc.scheduled_end > ? AND lc.status = 'scheduled'
     ORDER BY lc.scheduled_start LIMIT 5`,
    teacherId,
    nowIso(),
  ).map(mapLiveClass);

  return {
    stats: {
      students: stats?.student_count ?? 0,
      publishedCourses: stats?.published_courses ?? 0,
      upcomingClasses: stats?.upcoming_classes ?? 0,
      lectures: stats?.lecture_count ?? 0,
      publishedTests: stats?.published_tests ?? 0,
      avgAccuracy: stats?.avg_accuracy ?? null,
    },
    courses: courses.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      exam: c.exam,
      category: c.category,
      status: c.status,
      priceCents: c.price_cents,
      theme: c.thumbnail_theme || c.category,
      enrolledCount: c.enrolled_count,
      lectureCount: c.lecture_count,
      ratingAvg: c.rating_avg,
      ratingCount: c.rating_count,
      nextLiveAt: c.next_live_at,
      updatedAt: c.updated_at,
      totalDurationSeconds: c.total_seconds,
    })),
    students,
    recentEnrollments,
    upcoming,
  };
}

export function adminOverview() {
  const counts = get(
    `SELECT
      (SELECT COUNT(*) FROM users WHERE role = 'student' AND deleted_at IS NULL) AS students,
      (SELECT COUNT(*) FROM users WHERE role = 'teacher' AND deleted_at IS NULL) AS teachers,
      (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
      (SELECT COUNT(*) FROM courses WHERE status = 'published' AND deleted_at IS NULL) AS published_courses,
      (SELECT COUNT(*) FROM courses WHERE deleted_at IS NULL) AS total_courses,
      (SELECT COUNT(*) FROM enrollments WHERE status = 'active') AS enrollments,
      (SELECT COUNT(*) FROM live_classes) AS live_sessions,
      (SELECT COUNT(*) FROM test_attempts WHERE status != 'in_progress') AS test_attempts,
      (SELECT COUNT(*) FROM study_materials) AS materials,
      (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') AS new_messages,
      (SELECT COUNT(*) FROM users WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now','-30 days') AND deleted_at IS NULL) AS new_users_30d
    `,
  );

  const popularCourses = all(
    `SELECT c.id, c.title, c.exam, c.category, c.thumbnail_theme,
      (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id AND e.status = 'active') AS enrolled_count,
      (SELECT ROUND(AVG(r.rating), 1) FROM reviews r WHERE r.course_id = c.id) AS rating_avg,
      u.name AS teacher_name
     FROM courses c JOIN users u ON u.id = c.teacher_id
     WHERE c.status = 'published' AND c.deleted_at IS NULL
     ORDER BY enrolled_count DESC LIMIT 6`,
  );

  const monthly = all(
    `SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
     FROM users WHERE created_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now','-6 months')
     GROUP BY month ORDER BY month ASC`,
  );

  const recentUsers = all(
    `SELECT id, name, email, role, avatar_color, created_at, status
     FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 8`,
  );

  const monthlyEnrollments = all(
    `SELECT strftime('%Y-%m', enrolled_at) AS month, COUNT(*) AS count
     FROM enrollments WHERE enrolled_at >= strftime('%Y-%m-%dT%H:%M:%fZ','now','-6 months')
     GROUP BY month ORDER BY month ASC`,
  );

  return {
    counts: { ...counts, paymentsConfigured: env.integrations.razorpay, revenueCents: null },
    popularCourses,
    monthlyRegistrations: monthly,
    monthlyEnrollments,
    recentUsers,
    integrations: env.integrations,
    system: {
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      platform: `${os.type()} ${os.release()}`,
      memoryUsedMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      environment: env.nodeEnv,
    },
  };
}

export function teacherStudentMonitor(teacherId, studentId) {
  const enrollment = get(
    `SELECT e.*, c.title AS course_title FROM enrollments e JOIN courses c ON c.id = e.course_id
     WHERE e.user_id = ? AND c.teacher_id = ? LIMIT 1`,
    studentId,
    teacherId,
  );
  if (!enrollment) throw new Error('Student is not enrolled in your courses.');
  const performance = studentPerformance(studentId);
  const courses = all(
    `SELECT c.id, c.title, c.thumbnail_theme,
      (SELECT COUNT(*) FROM lectures l WHERE l.course_id = c.id) AS lecture_count,
      (SELECT COUNT(*) FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
        WHERE l.course_id = c.id AND lp.user_id = ? AND lp.completed = 1) AS completed_count
     FROM courses c JOIN enrollments e ON e.course_id = c.id
     WHERE e.user_id = ? AND c.teacher_id = ?`,
    studentId,
    studentId,
    teacherId,
  );
  return { performance, courses };
}
