import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { all, get, run, transaction } from '../config/db.js';
import { env } from '../config/env.js';
import { COURSE_SELECT } from '../models/courses.js';
import { mapCourse } from '../models/serialize.js';
import { nowIso, slugify, parseJson } from '../utils/misc.js';
import { asyncHandler, ApiError, sendData } from '../utils/http.js';
import { teacherOverview, teacherStudentMonitor } from '../services/analytics.service.js';
import { notifyCourseEnrollees, createNotification } from '../services/notification.service.js';
import { recordUpload } from '../middleware/upload.js';

function courseOwnedBy(courseId, user) {
  const course = get('SELECT * FROM courses WHERE id = ? AND deleted_at IS NULL', courseId);
  if (!course) throw ApiError.notFound('Course not found.');
  if (user.role !== 'admin' && course.teacher_id !== user.id) {
    throw ApiError.forbidden('This course is not assigned to you.');
  }
  return course;
}

function uniqueSlug(title) {
  const base = slugify(title) || 'course';
  let slug = base;
  let attempt = 1;
  while (get('SELECT id FROM courses WHERE slug = ?', slug)) {
    slug = `${base}-${++attempt}`;
  }
  return slug;
}

export const overview = asyncHandler(async (req, res) => {
  return sendData(res, teacherOverview(req.user.id));
});

export const listCourses = asyncHandler(async (req, res) => {
  const rows = all(
    `${COURSE_SELECT} WHERE c.teacher_id = ? AND c.deleted_at IS NULL ORDER BY c.updated_at DESC`,
    req.user.id,
  ).map(mapCourse).map((course) => ({
    ...course,
    students: get(
      `SELECT COUNT(*) AS count FROM enrollments WHERE course_id = ? AND status = 'active'`,
      course.id,
    )?.count ?? 0,
  }));
  return sendData(res, { courses: rows });
});

export const courseSchema = z.object({
  title: z.string().trim().min(6).max(140),
  subtitle: z.string().trim().max(180).optional().default(''),
  description: z.string().trim().min(40).max(4000),
  category: z.string().trim().min(2),
  exam: z.string().trim().min(2).max(60),
  classLevel: z.string().trim().max(50).optional().default(''),
  subjectArea: z.string().trim().max(80).optional().default(''),
  language: z.string().trim().max(30).default('English'),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).default('Intermediate'),
  durationWeeks: z.coerce.number().int().min(1).max(104).default(12),
  priceCents: z.coerce.number().int().min(0).max(100000000).default(0),
  mrpCents: z.coerce.number().int().min(0).max(100000000).default(0),
  thumbnailTheme: z.string().trim().max(50).optional().default(''),
  startDate: z.string().trim().max(20).optional().default(''),
  endDate: z.string().trim().max(20).optional().default(''),
  validityDays: z.coerce.number().int().min(30).max(3650).default(365),
  batchTimings: z.string().trim().max(160).optional().default(''),
  learningObjectives: z.array(z.string().trim().min(4).max(300)).max(12).default([]),
  targetAudience: z.string().trim().max(500).optional().default(''),
});

export const courseUpdateSchema = z.object({
  title: z.string().trim().min(6).max(140).optional(),
  subtitle: z.string().trim().max(180).optional(),
  description: z.string().trim().min(40).max(4000).optional(),
  category: z.string().trim().min(2).optional(),
  exam: z.string().trim().min(2).max(60).optional(),
  classLevel: z.string().trim().max(50).optional(),
  subjectArea: z.string().trim().max(80).optional(),
  language: z.string().trim().max(30).optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  durationWeeks: z.coerce.number().int().min(1).max(104).optional(),
  priceCents: z.coerce.number().int().min(0).max(100000000).optional(),
  mrpCents: z.coerce.number().int().min(0).max(100000000).optional(),
  thumbnailTheme: z.string().trim().max(50).optional(),
  startDate: z.string().trim().max(20).optional(),
  endDate: z.string().trim().max(20).optional(),
  validityDays: z.coerce.number().int().min(30).max(3650).optional(),
  batchTimings: z.string().trim().max(160).optional(),
  learningObjectives: z.array(z.string().trim().min(4).max(300)).max(12).optional(),
  targetAudience: z.string().trim().max(500).optional(),
});

export const createCourse = asyncHandler(async (req, res) => {
  const data = req.body;
  const category = get('SELECT slug FROM categories WHERE slug = ?', data.category);
  if (!category) throw ApiError.badRequest('Choose a valid category.');
  if (data.mrpCents > 0 && data.priceCents > data.mrpCents) {
    throw ApiError.badRequest('Discount price cannot exceed the list price.');
  }
  const id = crypto.randomUUID();
  const now = nowIso();
  run(
    `INSERT INTO courses (id, slug, title, subtitle, description, category, exam, class_level, subject_area,
      language, level, duration_weeks, price_cents, mrp_cents, thumbnail_theme, teacher_id, status,
      learning_objectives, target_audience, start_date, end_date, validity_days, batch_timings, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    uniqueSlug(data.title),
    data.title,
    data.subtitle,
    data.description,
    data.category,
    data.exam,
    data.classLevel || null,
    data.subjectArea || null,
    data.language,
    data.level,
    data.durationWeeks,
    data.priceCents,
    data.mrpCents || data.priceCents,
    data.thumbnailTheme || data.category,
    req.user.id,
    JSON.stringify(data.learningObjectives || []),
    data.targetAudience || null,
    data.startDate || null,
    data.endDate || null,
    data.validityDays,
    data.batchTimings || null,
    now,
    now,
  );
  return sendData(res, { course: mapCourse(get(`${COURSE_SELECT} WHERE c.id = ?`, id)) }, 201);
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = courseOwnedBy(req.params.id, req.user);
  const data = req.body;
  if (data.mrpCents !== undefined && data.priceCents !== undefined && data.mrpCents > 0 && data.priceCents > data.mrpCents) {
    throw ApiError.badRequest('Discount price cannot exceed the list price.');
  }
  if (data.category) {
    const category = get('SELECT slug FROM categories WHERE slug = ?', data.category);
    if (!category) throw ApiError.badRequest('Choose a valid category.');
  }
  run(
    `UPDATE courses SET
      title = COALESCE(?, title), subtitle = COALESCE(?, subtitle), description = COALESCE(?, description),
      category = COALESCE(?, category), exam = COALESCE(?, exam), class_level = COALESCE(?, class_level),
      subject_area = COALESCE(?, subject_area), language = COALESCE(?, language), level = COALESCE(?, level),
      duration_weeks = COALESCE(?, duration_weeks), price_cents = COALESCE(?, price_cents),
      mrp_cents = COALESCE(?, mrp_cents), thumbnail_theme = COALESCE(?, thumbnail_theme),
      learning_objectives = COALESCE(?, learning_objectives), target_audience = COALESCE(?, target_audience),
      start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date),
      validity_days = COALESCE(?, validity_days), batch_timings = COALESCE(?, batch_timings),
      updated_at = ?
     WHERE id = ?`,
    data.title ?? null,
    data.subtitle ?? null,
    data.description ?? null,
    data.category ?? null,
    data.exam ?? null,
    data.classLevel ?? null,
    data.subjectArea ?? null,
    data.language ?? null,
    data.level ?? null,
    data.durationWeeks ?? null,
    data.priceCents ?? null,
    data.mrpCents ?? null,
    data.thumbnailTheme ?? null,
    data.learningObjectives ? JSON.stringify(data.learningObjectives) : null,
    data.targetAudience ?? null,
    data.startDate ?? null,
    data.endDate ?? null,
    data.validityDays ?? null,
    data.batchTimings ?? null,
    nowIso(),
    course.id,
  );
  return sendData(res, { course: mapCourse(get(`${COURSE_SELECT} WHERE c.id = ?`, course.id)) });
});

export const courseManageDetail = asyncHandler(async (req, res) => {
  const course = courseOwnedBy(req.params.id, req.user);
  const row = get(`${COURSE_SELECT} WHERE c.id = ?`, course.id);
  const subjects = all('SELECT * FROM subjects WHERE course_id = ? ORDER BY position', course.id);
  const chapters = all('SELECT * FROM chapters WHERE course_id = ? ORDER BY position', course.id);
  const lectures = all('SELECT * FROM lectures WHERE course_id = ? ORDER BY position', course.id);
  const tests = all(
    `SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
     FROM tests t WHERE t.course_id = ? ORDER BY t.created_at DESC`,
    course.id,
  );
  const materials = all(
    'SELECT * FROM study_materials WHERE course_id = ? ORDER BY created_at DESC',
    course.id,
  );
  const liveClasses = all(
    'SELECT * FROM live_classes WHERE course_id = ? ORDER BY scheduled_start DESC LIMIT 20',
    course.id,
  );
  const students = all(
    `SELECT u.id, u.name, u.email, u.avatar_color, e.enrolled_at,
      (SELECT COUNT(*) FROM lecture_progress lp JOIN lectures l ON l.id = lp.lecture_id
        WHERE l.course_id = e.course_id AND lp.user_id = u.id AND lp.completed = 1) AS completed_lectures,
      (SELECT COUNT(*) FROM lectures l WHERE l.course_id = e.course_id) AS total_lectures,
      (SELECT ROUND(AVG(r.accuracy), 1) FROM results r WHERE r.user_id = u.id) AS avg_accuracy
     FROM enrollments e JOIN users u ON u.id = e.user_id
     WHERE e.course_id = ? AND e.status = 'active' ORDER BY e.enrolled_at DESC LIMIT 100`,
    course.id,
  );
  return sendData(res, {
    course: mapCourse(row),
    curriculum: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      chapters: chapters
        .filter((ch) => ch.subject_id === subject.id)
        .map((chapter) => ({
          id: chapter.id,
          name: chapter.name,
          lectures: lectures
            .filter((l) => l.chapter_id === chapter.id)
            .map((l) => ({
              id: l.id,
              title: l.title,
              description: l.description,
              durationSeconds: l.duration_seconds,
              position: l.position,
              isPreview: Boolean(l.is_preview),
              hasVideo: Boolean(l.video_key),
            })),
        })),
      ungroupedLectures: lectures
        .filter((l) => !l.chapter_id)
        .map((l) => ({ id: l.id, title: l.title, durationSeconds: l.duration_seconds, isPreview: Boolean(l.is_preview), hasVideo: Boolean(l.video_key) })),
    })),
    tests: tests.map((t) => ({
      id: t.id,
      title: t.title,
      type: t.type,
      status: t.status,
      durationMinutes: t.duration_minutes,
      totalMarks: t.total_marks,
      questionCount: t.question_count,
      attemptCount: t.attempt_count,
      createdAt: t.created_at,
    })),
    materials: materials.map((m) => ({
      id: m.id,
      title: m.title,
      category: m.category,
      subject: m.subject,
      isPremium: Boolean(m.is_premium),
      downloadCount: m.download_count,
      createdAt: m.created_at,
    })),
    liveClasses: liveClasses.map((l) => ({
      id: l.id,
      title: l.title,
      scheduledStart: l.scheduled_start,
      scheduledEnd: l.scheduled_end,
      status: l.status,
    })),
    students: students.map((s) => ({
      ...s,
      progressPercent: s.total_lectures ? Math.round((s.completed_lectures / s.total_lectures) * 100) : 0,
    })),
    stats: {
      enrollments: students.length,
      lectures: lectures.length,
      tests: tests.length,
      materials: materials.length,
    },
  });
});

const subjectSchema = z.object({ name: z.string().trim().min(2).max(80) });

export const createSubject = asyncHandler(async (req, res) => {
  const course = courseOwnedBy(req.params.id, req.user);
  const position = get('SELECT COALESCE(MAX(position), 0) AS p FROM subjects WHERE course_id = ?', course.id)?.p ?? 0;
  const id = crypto.randomUUID();
  run('INSERT INTO subjects (id, course_id, name, position) VALUES (?, ?, ?, ?)', id, course.id, req.body.name, position + 1);
  return sendData(res, { subject: { id, name: req.body.name, position: position + 1 } }, 201);
});

export const deleteSubject = asyncHandler(async (req, res) => {
  const subject = get('SELECT * FROM subjects WHERE id = ?', req.params.id);
  if (!subject) throw ApiError.notFound('Subject not found.');
  courseOwnedBy(subject.course_id, req.user);
  run('DELETE FROM subjects WHERE id = ?', subject.id);
  return sendData(res, { success: true });
});

const chapterSchema = z.object({ name: z.string().trim().min(2).max(120) });

export const createChapter = asyncHandler(async (req, res) => {
  const subject = get('SELECT * FROM subjects WHERE id = ?', req.params.id);
  if (!subject) throw ApiError.notFound('Subject not found.');
  courseOwnedBy(subject.course_id, req.user);
  const position = get('SELECT COALESCE(MAX(position), 0) AS p FROM chapters WHERE subject_id = ?', subject.id)?.p ?? 0;
  const id = crypto.randomUUID();
  run(
    'INSERT INTO chapters (id, subject_id, course_id, name, position) VALUES (?, ?, ?, ?, ?)',
    id,
    subject.id,
    subject.course_id,
    req.body.name,
    position + 1,
  );
  return sendData(res, { chapter: { id, name: req.body.name, subjectId: subject.id } }, 201);
});

export const deleteChapter = asyncHandler(async (req, res) => {
  const chapter = get('SELECT * FROM chapters WHERE id = ?', req.params.id);
  if (!chapter) throw ApiError.notFound('Chapter not found.');
  courseOwnedBy(chapter.course_id, req.user);
  run('DELETE FROM chapters WHERE id = ?', chapter.id);
  return sendData(res, { success: true });
});

export const lectureSchema = z.object({
  chapterId: z.string().uuid(),
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().max(2000).optional().default(''),
  durationSeconds: z.coerce.number().int().min(30).max(36000),
  isPreview: z.boolean().optional().default(false),
  videoKey: z.string().trim().max(300).optional().default(''),
});

export const createLecture = asyncHandler(async (req, res) => {
  const chapter = get('SELECT * FROM chapters WHERE id = ?', req.body.chapterId);
  if (!chapter) throw ApiError.notFound('Chapter not found.');
  const course = courseOwnedBy(chapter.course_id, req.user);
  if (req.body.videoKey) assertUpload(req.body.videoKey, req.user.id, 'video');
  const position = get('SELECT COALESCE(MAX(position), 0) AS p FROM lectures WHERE course_id = ?', course.id)?.p ?? 0;
  const id = crypto.randomUUID();
  run(
    `INSERT INTO lectures (id, course_id, chapter_id, title, description, video_key, duration_seconds, position,
      is_preview, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    course.id,
    chapter.id,
    req.body.title,
    req.body.description,
    req.body.videoKey || null,
    req.body.durationSeconds,
    position + 1,
    req.body.isPreview ? 1 : 0,
    nowIso(),
    nowIso(),
  );
  run('UPDATE courses SET updated_at = ? WHERE id = ?', nowIso(), course.id);
  if (req.body.videoKey) {
    notifyCourseEnrollees(course.id, {
      type: 'lecture',
      title: 'New lecture uploaded',
      body: `${req.body.title} is now available in ${course.title}.`,
      link: `/dashboard/lectures/${id}`,
    });
  }
  return sendData(res, { lecture: { id, title: req.body.title } }, 201);
});

export const updateLecture = asyncHandler(async (req, res) => {
  const lecture = get('SELECT * FROM lectures WHERE id = ?', req.params.id);
  if (!lecture) throw ApiError.notFound('Lecture not found.');
  const course = courseOwnedBy(lecture.course_id, req.user);
  const data = req.body;
  if (data.videoKey) assertUpload(data.videoKey, req.user.id, 'video');
  run(
    `UPDATE lectures SET title = COALESCE(?, title), description = COALESCE(?, description),
      duration_seconds = COALESCE(?, duration_seconds), is_preview = COALESCE(?, is_preview),
      video_key = COALESCE(?, video_key), updated_at = ? WHERE id = ?`,
    data.title ?? null,
    data.description ?? null,
    data.durationSeconds ?? null,
    data.isPreview === undefined ? null : data.isPreview ? 1 : 0,
    data.videoKey || null,
    nowIso(),
    lecture.id,
  );
  run('UPDATE courses SET updated_at = ? WHERE id = ?', nowIso(), course.id);
  return sendData(res, { success: true });
});

export const deleteLecture = asyncHandler(async (req, res) => {
  const lecture = get('SELECT * FROM lectures WHERE id = ?', req.params.id);
  if (!lecture) throw ApiError.notFound('Lecture not found.');
  courseOwnedBy(lecture.course_id, req.user);
  run('DELETE FROM lectures WHERE id = ?', lecture.id);
  return sendData(res, { success: true });
});

function assertUpload(key, userId, kind) {
  const upload = get('SELECT * FROM uploads WHERE storage_key = ? AND uploaded_by = ? AND kind = ?', key, userId, kind);
  if (!upload) throw ApiError.badRequest('Upload the file first, then attach the returned file key.');
  const filePath = path.resolve(env.uploadsDir, key);
  if (!fs.existsSync(filePath)) throw ApiError.badRequest('The uploaded file could not be found on disk.');
  return upload;
}

export const uploadVideo = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose a video file to upload.');
  if (req.file.kind !== 'video') throw ApiError.badRequest('Only MP4 or WEBM videos are accepted here.');
  const result = recordUpload(req, req.file);
  return sendData(res, { upload: result }, 201);
});

export const uploadPdf = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Choose a PDF file to upload.');
  if (req.file.kind !== 'pdf') throw ApiError.badRequest('Only PDF files are accepted here.');
  if (req.file.size > 30 * 1024 * 1024) {
    fs.unlink(req.file.path, () => {});
    throw ApiError.badRequest('PDF files must be 30 MB or smaller.');
  }
  const result = recordUpload(req, req.file);
  return sendData(res, { upload: result }, 201);
});

export const listTests = asyncHandler(async (req, res) => {
  const rows = all(
    `SELECT t.*, c.title AS course_title,
      (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
     FROM tests t LEFT JOIN courses c ON c.id = t.course_id
     WHERE t.created_by = ? ORDER BY t.created_at DESC`,
    req.user.id,
  ).map((t) => ({
    id: t.id,
    title: t.title,
    exam: t.exam,
    type: t.type,
    status: t.status,
    courseId: t.course_id,
    courseTitle: t.course_title,
    durationMinutes: t.duration_minutes,
    totalMarks: t.total_marks,
    questionCount: t.question_count,
    attemptCount: t.attempt_count,
    createdAt: t.created_at,
  }));
  return sendData(res, { tests: rows });
});

export const testSchema = z.object({
  title: z.string().trim().min(5).max(160),
  description: z.string().trim().max(2000).optional().default(''),
  exam: z.string().trim().min(2).max(60),
  type: z.enum(['full_length', 'chapter', 'subject', 'daily', 'weekly', 'previous_year', 'quiz']),
  courseId: z.string().uuid().nullable().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(360),
  negativeMarking: z.coerce.number().min(0).max(2).default(0.33),
  instructions: z.array(z.string().trim().min(3).max(400)).max(15).default([]),
  startAt: z.string().optional().default(''),
  endAt: z.string().optional().default(''),
});

export const createTest = asyncHandler(async (req, res) => {
  const data = req.body;
  if (data.courseId) courseOwnedBy(data.courseId, req.user);
  const id = crypto.randomUUID();
  const now = nowIso();
  run(
    `INSERT INTO tests (id, title, description, exam, type, course_id, duration_minutes, total_marks,
      negative_marking, status, instructions, created_by, start_at, end_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'draft', ?, ?, ?, ?, ?, ?)`,
    id,
    data.title,
    data.description,
    data.exam,
    data.type,
    data.courseId || null,
    data.durationMinutes,
    data.negativeMarking,
    JSON.stringify(data.instructions || []),
    req.user.id,
    data.startAt || null,
    data.endAt || null,
    now,
    now,
  );
  return sendData(res, { testId: id }, 201);
});

export const testManageDetail = asyncHandler(async (req, res) => {
  const test = get('SELECT * FROM tests WHERE id = ?', req.params.id);
  if (!test) throw ApiError.notFound('Test not found.');
  if (req.user.role !== 'admin' && test.created_by !== req.user.id) throw ApiError.forbidden();
  const questions = all('SELECT * FROM questions WHERE test_id = ? ORDER BY position', test.id).map((q) => ({
    id: q.id,
    subject: q.subject,
    chapter: q.chapter,
    type: q.type,
    text: q.text,
    options: parseJson(q.options, []),
    correctAnswer: q.correct_answer,
    tolerance: q.tolerance,
    marks: q.marks,
    negativeMarks: q.negative_marks,
    explanation: q.explanation,
    position: q.position,
  }));
  return sendData(res, {
    test: {
      id: test.id,
      title: test.title,
      description: test.description,
      exam: test.exam,
      type: test.type,
      courseId: test.course_id,
      durationMinutes: test.duration_minutes,
      totalMarks: test.total_marks,
      negativeMarking: test.negative_marking,
      status: test.status,
      instructions: parseJson(test.instructions, []),
      startAt: test.start_at,
      endAt: test.end_at,
    },
    questions,
  });
});

export const updateTest = asyncHandler(async (req, res) => {
  const test = get('SELECT * FROM tests WHERE id = ?', req.params.id);
  if (!test) throw ApiError.notFound('Test not found.');
  if (req.user.role !== 'admin' && test.created_by !== req.user.id) throw ApiError.forbidden();
  const data = req.body;
  if (data.courseId) courseOwnedBy(data.courseId, req.user);
  if (data.status === 'published') {
    const count = get('SELECT COUNT(*) AS count FROM questions WHERE test_id = ?', test.id)?.count ?? 0;
    if (count === 0) throw ApiError.badRequest('Add at least one question before publishing this test.');
  }
  run(
    `UPDATE tests SET title = COALESCE(?, title), description = COALESCE(?, description),
      exam = COALESCE(?, exam), type = COALESCE(?, type), course_id = COALESCE(?, course_id),
      duration_minutes = COALESCE(?, duration_minutes), negative_marking = COALESCE(?, negative_marking),
      status = COALESCE(?, status), instructions = COALESCE(?, instructions),
      start_at = COALESCE(?, start_at), end_at = COALESCE(?, end_at), updated_at = ?
     WHERE id = ?`,
    data.title ?? null,
    data.description ?? null,
    data.exam ?? null,
    data.type ?? null,
    data.courseId ?? null,
    data.durationMinutes ?? null,
    data.negativeMarking ?? null,
    data.status ?? null,
    data.instructions ? JSON.stringify(data.instructions) : null,
    data.startAt ?? null,
    data.endAt ?? null,
    nowIso(),
    test.id,
  );
  if (data.status === 'published' && test.status !== 'published') {
    const updated = get('SELECT * FROM tests WHERE id = ?', test.id);
    if (updated.course_id) {
      notifyCourseEnrollees(updated.course_id, {
        type: 'test',
        title: 'New test published',
        body: `${updated.title} is now available. Attempt it before the window closes.`,
        link: `/tests/${updated.id}`,
      });
    } else {
      const students = all(`SELECT id FROM users WHERE role = 'student' AND deleted_at IS NULL`);
      for (const student of students) {
        createNotification(student.id, {
          type: 'test',
          title: 'New practice test published',
          body: `${updated.title} (${updated.exam}) is now available on EduPulse.`,
          link: `/tests/${updated.id}`,
        });
      }
    }
  }
  return sendData(res, { success: true });
});

const optionSchema = z.object({ id: z.string().trim().min(1).max(3), text: z.string().trim().min(1).max(800) });
export const questionSchema = z.object({
  subject: z.string().trim().min(2).max(60),
  chapter: z.string().trim().max(120).optional().default(''),
  type: z.enum(['mcq', 'numerical']),
  text: z.string().trim().min(8).max(3000),
  options: z.array(optionSchema).max(6).default([]),
  correctAnswer: z.string().trim().min(1).max(400),
  tolerance: z.coerce.number().min(0).max(100).default(0),
  marks: z.coerce.number().int().min(1).max(20).default(4),
  negativeMarks: z.coerce.number().min(0).max(10).default(1),
  explanation: z.string().trim().max(4000).optional().default(''),
});

export const addQuestions = asyncHandler(async (req, res) => {
  const test = get('SELECT * FROM tests WHERE id = ?', req.params.id);
  if (!test) throw ApiError.notFound('Test not found.');
  if (req.user.role !== 'admin' && test.created_by !== req.user.id) throw ApiError.forbidden();
  const questions = req.body.questions;
  for (const q of questions) {
    if (q.type === 'mcq') {
      if (q.options.length < 2) throw ApiError.badRequest('MCQ questions need at least two options.');
      const ids = new Set(q.options.map((o) => o.id));
      if (ids.size !== q.options.length) throw ApiError.badRequest('Option labels must be unique.');
      if (!ids.has(q.correctAnswer)) throw ApiError.badRequest('The correct answer must match an option label.');
    } else if (!Number.isFinite(Number(q.correctAnswer))) {
      throw ApiError.badRequest('Numerical questions need a numeric correct answer.');
    }
  }
  const startPosition = get('SELECT COALESCE(MAX(position), 0) AS p FROM questions WHERE test_id = ?', test.id)?.p ?? 0;
  transaction(() => {
    questions.forEach((q, index) => {
      run(
        `INSERT INTO questions (id, test_id, subject, chapter, type, text, options, correct_answer, tolerance,
          marks, negative_marks, explanation, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        crypto.randomUUID(),
        test.id,
        q.subject,
        q.chapter || null,
        q.type,
        q.text,
        JSON.stringify(q.type === 'mcq' ? q.options : []),
        q.correctAnswer,
        q.type === 'numerical' ? q.tolerance : 0,
        q.marks,
        q.negativeMarks,
        q.explanation,
        startPosition + index + 1,
      );
    });
    run(
      'UPDATE tests SET total_marks = (SELECT COALESCE(SUM(marks), 0) FROM questions WHERE test_id = ?), updated_at = ? WHERE id = ?',
      test.id,
      nowIso(),
      test.id,
    );
  });
  const total = get('SELECT COALESCE(SUM(marks), 0) AS marks, COUNT(*) AS count FROM questions WHERE test_id = ?', test.id);
  return sendData(res, { added: questions.length, questionCount: total?.count ?? 0, totalMarks: total?.marks ?? 0 }, 201);
});

export const deleteQuestion = asyncHandler(async (req, res) => {
  const question = get('SELECT * FROM questions WHERE id = ?', req.params.id);
  if (!question) throw ApiError.notFound('Question not found.');
  const test = get('SELECT * FROM tests WHERE id = ?', question.test_id);
  if (req.user.role !== 'admin' && test.created_by !== req.user.id) throw ApiError.forbidden();
  run('DELETE FROM questions WHERE id = ?', question.id);
  run(
    'UPDATE tests SET total_marks = (SELECT COALESCE(SUM(marks), 0) FROM questions WHERE test_id = ?), updated_at = ? WHERE id = ?',
    test.id,
    nowIso(),
    test.id,
  );
  return sendData(res, { success: true });
});

export const materialSchema = z.object({
  title: z.string().trim().min(4).max(160),
  description: z.string().trim().max(800).optional().default(''),
  exam: z.string().trim().min(2).max(60),
  category: z.string().trim().min(2).max(60),
  subject: z.string().trim().max(60).optional().default(''),
  chapterName: z.string().trim().max(120).optional().default(''),
  isPremium: z.boolean().default(false),
  courseId: z.string().uuid().nullable().optional(),
  fileKey: z.string().trim().min(3).max(300),
});

export const createMaterial = asyncHandler(async (req, res) => {
  if (req.body.courseId) courseOwnedBy(req.body.courseId, req.user);
  assertUpload(req.body.fileKey, req.user.id, 'pdf');
  const id = crypto.randomUUID();
  run(
    `INSERT INTO study_materials (id, title, description, exam, category, subject, chapter_name, file_key,
      is_premium, course_id, download_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`,
    id,
    req.body.title,
    req.body.description,
    req.body.exam,
    req.body.category,
    req.body.subject || null,
    req.body.chapterName || null,
    req.body.fileKey,
    req.body.isPremium ? 1 : 0,
    req.body.courseId || null,
    nowIso(),
  );
  return sendData(res, { materialId: id }, 201);
});

export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = get('SELECT * FROM study_materials WHERE id = ?', req.params.id);
  if (!material) throw ApiError.notFound('Material not found.');
  if (material.course_id) courseOwnedBy(material.course_id, req.user);
  else throw ApiError.forbidden('Only course materials can be removed from this panel.');
  run('DELETE FROM study_materials WHERE id = ?', material.id);
  return sendData(res, { success: true });
});

export const listStudents = asyncHandler(async (req, res) => {
  const rows = all(
    `SELECT u.id, u.name, u.email, u.avatar_color,
      COUNT(DISTINCT e.course_id) AS course_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.user_id = u.id AND a.status != 'in_progress') AS tests_taken,
      (SELECT ROUND(AVG(r.accuracy), 1) FROM results r WHERE r.user_id = u.id) AS avg_accuracy,
      (SELECT MAX(a.submitted_at) FROM test_attempts a WHERE a.user_id = u.id) AS last_active
     FROM enrollments e JOIN courses c ON c.id = e.course_id JOIN users u ON u.id = e.user_id
     WHERE c.teacher_id = ? AND e.status = 'active'
     GROUP BY u.id ORDER BY last_active DESC NULLS LAST`,
    req.user.id,
  );
  return sendData(res, { students: rows });
});

export const studentDetail = asyncHandler(async (req, res) => {
  try {
    return sendData(res, teacherStudentMonitor(req.user.id, req.params.id));
  } catch (error) {
    throw ApiError.notFound(error.message);
  }
});

export const listMaterials = asyncHandler(async (req, res) => {
  const rows = all(
    `SELECT m.*, c.title AS course_title FROM study_materials m
     JOIN courses c ON c.id = m.course_id
     WHERE c.teacher_id = ? ORDER BY m.created_at DESC`,
    req.user.id,
  ).map((m) => ({
    id: m.id,
    title: m.title,
    exam: m.exam,
    category: m.category,
    subject: m.subject,
    isPremium: Boolean(m.is_premium),
    courseId: m.course_id,
    courseTitle: m.course_title,
    downloadCount: m.download_count,
    createdAt: m.created_at,
  }));
  return sendData(res, { materials: rows });
});

export const lectureUpdateSchema = z.object({
  title: z.string().trim().min(4).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  durationSeconds: z.coerce.number().int().min(30).max(36000).optional(),
  isPreview: z.boolean().optional(),
  videoKey: z.string().trim().max(300).optional(),
});

export const testUpdateSchema = z.object({
  title: z.string().trim().min(5).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  exam: z.string().trim().min(2).max(60).optional(),
  type: z.enum(['full_length', 'chapter', 'subject', 'daily', 'weekly', 'previous_year', 'quiz']).optional(),
  courseId: z.string().uuid().nullable().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(360).optional(),
  negativeMarking: z.coerce.number().min(0).max(2).optional(),
  instructions: z.array(z.string().trim().min(3).max(400)).max(15).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  startAt: z.string().optional(),
  endAt: z.string().optional(),
});

export const questionBatchSchema = z.object({
  questions: z.array(questionSchema).min(1).max(30),
});
