import crypto from 'node:crypto';
import { z } from 'zod';
import { all, get, run } from '../config/db.js';
import { mapLecture, mapTest, mapLiveClass } from '../models/serialize.js';
import { asyncHandler, ApiError, sendData } from '../utils/http.js';
import { nowIso, parseJson } from '../utils/misc.js';
import { hasCourseAccess, assertCourseAccess } from '../services/access.service.js';
import { studentDashboard, studentPerformance, calendar } from '../services/analytics.service.js';

function courseForLearning(user, courseId) {
  const course = get(
    `SELECT c.*, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color
     FROM courses c JOIN users u ON u.id = c.teacher_id WHERE c.id = ? AND c.deleted_at IS NULL`,
    courseId,
  );
  if (!course) throw ApiError.notFound('Course not found.');
  assertCourseAccess(user, course.id);
  return course;
}

function curriculumFor(user, courseId) {
  const subjects = all('SELECT * FROM subjects WHERE course_id = ? ORDER BY position', courseId);
  const chapters = all('SELECT * FROM chapters WHERE course_id = ? ORDER BY position', courseId);
  const lectures = all('SELECT * FROM lectures WHERE course_id = ? ORDER BY position', courseId);
  const progress = all(
    `SELECT lp.* FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
     WHERE l.course_id = ? AND lp.user_id = ?`,
    courseId,
    user.id,
  );
  const progressMap = new Map(progress.map((p) => [p.lecture_id, p]));
  return subjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    chapters: chapters
      .filter((ch) => ch.subject_id === subject.id)
      .map((chapter) => ({
        id: chapter.id,
        name: chapter.name,
        lectures: lectures
          .filter((l) => l.chapter_id === chapter.id)
          .map((l) =>
            mapLecture({
              ...l,
              completed: progressMap.get(l.id)?.completed,
              position_seconds: progressMap.get(l.id)?.position_seconds,
            }),
          ),
      })),
  }));
}

export const learningOverview = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') throw ApiError.forbidden('Student learning dashboard only.');
  return sendData(res, studentDashboard(req.user.id));
});

export const myCourse = asyncHandler(async (req, res) => {
  const course = courseForLearning(req.user, req.params.courseId);
  const curriculum = curriculumFor(req.user, course.id);
  const allLectures = curriculum.flatMap((s) => s.chapters.flatMap((c) => c.lectures));
  const completed = allLectures.filter((l) => l.completed).length;
  const nextLecture = allLectures.find((l) => !l.completed) || allLectures[0];
  const tests = all(
    `SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
     FROM tests t WHERE t.course_id = ? AND t.status = 'published' ORDER BY t.created_at DESC`,
    course.id,
  ).map(mapTest);
  const live = all(
    `SELECT lc.*, c.title AS course_title, u.name AS teacher_name, u.avatar_color AS teacher_avatar_color,
      (SELECT COUNT(*) FROM attendance a WHERE a.live_class_id = lc.id) AS attendee_count
     FROM live_classes lc JOIN users u ON u.id = lc.teacher_id LEFT JOIN courses c ON c.id = lc.course_id
     WHERE lc.course_id = ? AND lc.scheduled_end > ? AND lc.status = 'scheduled'
     ORDER BY lc.scheduled_start LIMIT 5`,
    course.id,
    nowIso(),
  ).map(mapLiveClass);
  const materials = all(
    'SELECT id, title, category, is_premium FROM study_materials WHERE course_id = ? ORDER BY created_at DESC LIMIT 6',
    course.id,
  ).map((m) => ({ id: m.id, title: m.title, category: m.category, isPremium: Boolean(m.is_premium) }));

  return sendData(res, {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      exam: course.exam,
      category: course.category,
      theme: course.thumbnail_theme || course.category,
      teacher: { id: course.teacher_id, name: course.teacher_name, avatarColor: course.teacher_avatar_color },
      language: course.language,
      level: course.level,
      validityDays: course.validity_days,
      batchTimings: course.batch_timings,
    },
    curriculum,
    progress: {
      totalLectures: allLectures.length,
      completedLectures: completed,
      percent: allLectures.length ? Math.round((completed / allLectures.length) * 100) : 0,
      nextLectureId: nextLecture?.id || null,
    },
    tests,
    live,
    materials,
  });
});

export const lectureDetails = asyncHandler(async (req, res) => {
  const lecture = get(
    `SELECT l.*, ch.name AS chapter_name, s.name AS subject_name
     FROM lectures l
     LEFT JOIN chapters ch ON ch.id = l.chapter_id
     LEFT JOIN subjects s ON s.id = ch.subject_id
     WHERE l.id = ?`,
    req.params.lectureId,
  );
  if (!lecture) throw ApiError.notFound('Lecture not found.');
  const course = get(
    `SELECT c.*, u.name AS teacher_name FROM courses c JOIN users u ON u.id = c.teacher_id WHERE c.id = ?`,
    lecture.course_id,
  );
  const hasAccess = hasCourseAccess(req.user, lecture.course_id);
  if (!hasAccess && !lecture.is_preview) {
    throw ApiError.forbidden('This lecture is part of a course. Enroll to unlock the full lecture.');
  }

  const siblings = all(
    'SELECT id, title, duration_seconds, position, is_preview FROM lectures WHERE course_id = ? ORDER BY position',
    lecture.course_id,
  );
  const index = siblings.findIndex((l) => l.id === lecture.id);
  const progress = get(
    'SELECT * FROM lecture_progress WHERE user_id = ? AND lecture_id = ?',
    req.user.id,
    lecture.id,
  );
  const totalLectures = siblings.length;
  const completedCount = get(
    `SELECT COUNT(*) AS count FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
     WHERE l.course_id = ? AND lp.user_id = ? AND lp.completed = 1`,
    lecture.course_id,
    req.user.id,
  )?.count ?? 0;
  const materials = all(
    'SELECT id, title, category, is_premium FROM study_materials WHERE course_id = ? ORDER BY created_at DESC LIMIT 5',
    lecture.course_id,
  ).map((m) => ({ id: m.id, title: m.title, category: m.category, isPremium: Boolean(m.is_premium) }));
  const bookmark = get(
    `SELECT id FROM bookmarks WHERE user_id = ? AND entity_type = 'lecture' AND entity_id = ?`,
    req.user.id,
    lecture.id,
  );

  return sendData(res, {
    lecture: {
      ...mapLecture({ ...lecture, completed: progress?.completed, position_seconds: progress?.position_seconds }),
      description: lecture.description,
      chapterName: lecture.chapter_name,
      subjectName: lecture.subject_name,
      streamUrl: `/api/media/video/${lecture.id}`,
      hasAccess,
    },
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      theme: course.thumbnail_theme || course.category,
      teacherName: course.teacher_name,
    },
    teacher: get('SELECT id, name, avatar_color, headline FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id WHERE u.id = ?', course.teacher_id),
    navigation: {
      previousId: index > 0 ? siblings[index - 1].id : null,
      nextId: index < siblings.length - 1 ? siblings[index + 1].id : null,
      current: index + 1,
      total: totalLectures,
      completedPercent: totalLectures ? Math.round((completedCount / totalLectures) * 100) : 0,
    },
    siblings: siblings.map((s) => ({
      id: s.id,
      title: s.title,
      duration: s.duration_seconds,
      isPreview: Boolean(s.is_preview),
      completed: Boolean(
        get('SELECT completed FROM lecture_progress WHERE user_id = ? AND lecture_id = ?', req.user.id, s.id)?.completed,
      ),
    })),
    progress: {
      positionSeconds: progress?.position_seconds ?? 0,
      completed: Boolean(progress?.completed),
    },
    materials,
    bookmarked: Boolean(bookmark),
  });
});

export const saveProgressSchema = z.object({
  positionSeconds: z.coerce.number().min(0).max(100000),
  durationSeconds: z.coerce.number().min(0).max(100000).optional(),
  completed: z.boolean().optional(),
});

function touchStreak(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const profile = get('SELECT * FROM student_profiles WHERE user_id = ?', userId);
  if (!profile) return;
  if (profile.last_active_date === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streak = profile.last_active_date === yesterday ? profile.streak_days + 1 : 1;
  run(
    'UPDATE student_profiles SET streak_days = ?, last_active_date = ? WHERE user_id = ?',
    streak,
    today,
    userId,
  );
}

export const saveLectureProgress = asyncHandler(async (req, res) => {
  const lecture = get('SELECT * FROM lectures WHERE id = ?', req.params.lectureId);
  if (!lecture) throw ApiError.notFound('Lecture not found.');
  assertCourseAccess(req.user, lecture.course_id);
  const { positionSeconds, durationSeconds, completed } = req.body;
  const duration = durationSeconds || lecture.duration_seconds || 0;
  const position = Math.min(positionSeconds, duration || positionSeconds);
  const isComplete = completed ?? (duration > 0 && position >= duration * 0.9);
  const existing = get(
    'SELECT * FROM lecture_progress WHERE user_id = ? AND lecture_id = ?',
    req.user.id,
    lecture.id,
  );
  const now = nowIso();
  if (existing) {
    run(
      `UPDATE lecture_progress SET position_seconds = ?, duration_seconds = ?, completed = ?, updated_at = ?
       WHERE id = ?`,
      Math.round(position),
      Math.round(duration),
      isComplete || existing.completed ? 1 : 0,
      now,
      existing.id,
    );
  } else {
    run(
      `INSERT INTO lecture_progress (id, user_id, lecture_id, position_seconds, duration_seconds, completed, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      crypto.randomUUID(),
      req.user.id,
      lecture.id,
      Math.round(position),
      Math.round(duration),
      isComplete ? 1 : 0,
      now,
    );
  }
  touchStreak(req.user.id);
  return sendData(res, { savedAt: now, positionSeconds: Math.round(position), completed: isComplete });
});

export const completeLecture = asyncHandler(async (req, res) => {
  const lecture = get('SELECT * FROM lectures WHERE id = ?', req.params.lectureId);
  if (!lecture) throw ApiError.notFound('Lecture not found.');
  assertCourseAccess(req.user, lecture.course_id);
  const existing = get(
    'SELECT * FROM lecture_progress WHERE user_id = ? AND lecture_id = ?',
    req.user.id,
    lecture.id,
  );
  if (existing) {
    run(
      'UPDATE lecture_progress SET completed = 1, position_seconds = MAX(position_seconds, ?), updated_at = ? WHERE id = ?',
      lecture.duration_seconds,
      nowIso(),
      existing.id,
    );
  } else {
    run(
      `INSERT INTO lecture_progress (id, user_id, lecture_id, position_seconds, duration_seconds, completed, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      crypto.randomUUID(),
      req.user.id,
      lecture.id,
      lecture.duration_seconds,
      lecture.duration_seconds,
      nowIso(),
    );
  }
  touchStreak(req.user.id);
  const total = get('SELECT COUNT(*) AS count FROM lectures WHERE course_id = ?', lecture.course_id)?.count ?? 0;
  const completed = get(
    `SELECT COUNT(*) AS count FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
     WHERE l.course_id = ? AND lp.user_id = ? AND lp.completed = 1`,
    lecture.course_id,
    req.user.id,
  )?.count ?? 0;
  return sendData(res, {
    completed: true,
    courseProgressPercent: total ? Math.round((completed / total) * 100) : 0,
  });
});

export const learningCalendar = asyncHandler(async (req, res) => {
  const month = req.query.month;
  let from;
  let to;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    from = new Date(`${month}-01T00:00:00.000Z`);
    to = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 1));
  } else {
    from = new Date(Date.now() - 7 * 86400000);
    to = new Date(Date.now() + 60 * 86400000);
  }
  const data = calendar(req.user.id, from.toISOString(), to.toISOString());
  return sendData(res, { ...data, from: from.toISOString(), to: to.toISOString() });
});

export const learningPerformance = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') throw ApiError.forbidden('Student analytics only.');
  return sendData(res, studentPerformance(req.user.id));
});

export const myAttempts = asyncHandler(async (req, res) => {
  const rows = all(
    `SELECT a.id, a.status, a.started_at, a.submitted_at, a.score, a.time_taken_seconds,
      t.title AS test_title, t.exam, t.total_marks, r.id AS result_id, r.rank, r.percentile, r.max_marks, r.accuracy
     FROM test_attempts a JOIN tests t ON t.id = a.test_id LEFT JOIN results r ON r.attempt_id = a.id
     WHERE a.user_id = ? ORDER BY a.started_at DESC LIMIT 50`,
    req.user.id,
  );
  return sendData(res, {
    attempts: rows.map((r) => ({
      id: r.id,
      status: r.status,
      testTitle: r.test_title,
      exam: r.exam,
      startedAt: r.started_at,
      submittedAt: r.submitted_at,
      score: r.score,
      maxMarks: r.max_marks ?? r.total_marks,
      accuracy: r.accuracy,
      rank: r.rank,
      percentile: r.percentile,
      timeTakenSeconds: r.time_taken_seconds,
      resultId: r.result_id,
    })),
  });
});

export const lectureResources = asyncHandler(async (req, res) => {
  const lecture = get('SELECT * FROM lectures WHERE id = ?', req.params.lectureId);
  if (!lecture) throw ApiError.notFound('Lecture not found.');
  const materials = all(
    'SELECT id, title, category, subject, is_premium FROM study_materials WHERE course_id = ?',
    lecture.course_id,
  );
  return sendData(res, { materials });
});
