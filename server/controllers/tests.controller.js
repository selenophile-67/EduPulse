import { z } from 'zod';
import { all, get } from '../config/db.js';
import { mapTest } from '../models/serialize.js';
import { parsePagination, paginated, parseJson, nowIso } from '../utils/misc.js';
import { asyncHandler, ApiError, sendData } from '../utils/http.js';
import { hasCourseAccess } from '../services/access.service.js';
import {
  startAttempt, attemptState, saveAnswers, submitAttempt, getResultDetail, testLeaderboard,
} from '../services/test.service.js';

export const listTests = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { limit: 12 });
  const { q, exam, type, courseId, sort = 'newest' } = req.query;
  const where = [`t.status = 'published'`];
  const params = [];
  if (q) {
    const term = `%${String(q).trim()}%`;
    where.push('(t.title LIKE ? OR t.description LIKE ? OR t.exam LIKE ?)');
    params.push(term, term, term);
  }
  if (exam) {
    where.push('t.exam = ?');
    params.push(exam);
  }
  if (type) {
    where.push('t.type = ?');
    params.push(type);
  }
  if (courseId) {
    where.push('t.course_id = ?');
    params.push(courseId);
  }
  const order = sort === 'popular' ? 'attempt_count DESC' : 't.created_at DESC';
  const rows = all(
    `SELECT t.*, c.title AS course_title,
      (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
     FROM tests t LEFT JOIN courses c ON c.id = t.course_id
     WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  );
  const items = rows.map((row) => {
    const test = mapTest(row);
    test.requiresEnrollment = Boolean(row.course_id);
    test.canAttempt = !row.course_id || (req.user ? hasCourseAccess(req.user, row.course_id) : false);
    if (req.user) {
      const attempt = get(
        `SELECT id, status FROM test_attempts WHERE test_id = ? AND user_id = ? ORDER BY started_at DESC LIMIT 1`,
        row.id,
        req.user.id,
      );
      test.latestAttempt = attempt || null;
    }
    return test;
  });
  const total = get(
    `SELECT COUNT(*) AS count FROM tests t WHERE ${where.join(' AND ')}`,
    ...params,
  );
  return sendData(res, paginated(items, total?.count ?? 0, page, limit));
});

export const testMeta = asyncHandler(async (_req, res) => {
  const exams = all(
    `SELECT exam, COUNT(*) AS count FROM tests WHERE status = 'published' GROUP BY exam ORDER BY count DESC`,
  );
  const types = all(
    `SELECT type, COUNT(*) AS count FROM tests WHERE status = 'published' GROUP BY type ORDER BY count DESC`,
  );
  return sendData(res, { exams, types });
});

export const testDetails = asyncHandler(async (req, res) => {
  const row = get(
    `SELECT t.*, c.title AS course_title, c.slug AS course_slug,
      (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
     FROM tests t LEFT JOIN courses c ON c.id = t.course_id
     WHERE t.id = ?`,
    req.params.id,
  );
  if (!row || row.status !== 'published') throw ApiError.notFound('This test is not available.');
  const distribution = all(
    `SELECT subject, COUNT(*) AS count, SUM(marks) AS marks FROM questions
     WHERE test_id = ? GROUP BY subject ORDER BY subject`,
    row.id,
  );
  const test = mapTest(row);
  const access = !row.course_id || hasCourseAccess(req.user, row.course_id);
  let attempts = [];
  let inProgress = null;
  if (req.user) {
    attempts = all(
      `SELECT a.id, a.status, a.started_at, a.submitted_at, a.score, a.correct_count, a.incorrect_count,
        a.unattempted_count, a.time_taken_seconds, r.id AS result_id, r.max_marks, r.accuracy, r.rank, r.percentile
       FROM test_attempts a LEFT JOIN results r ON r.attempt_id = a.id
       WHERE a.test_id = ? AND a.user_id = ? ORDER BY a.started_at DESC`,
      row.id,
      req.user.id,
    ).map((a) => ({
      id: a.id,
      status: a.status,
      startedAt: a.started_at,
      submittedAt: a.submitted_at,
      score: a.score,
      maxMarks: a.max_marks,
      accuracy: a.accuracy,
      rank: a.rank,
      percentile: a.percentile,
      resultId: a.result_id,
      timeTakenSeconds: a.time_taken_seconds,
    }));
    inProgress = attempts.find((a) => a.status === 'in_progress') || null;
  }
  return sendData(res, {
    test,
    distribution,
    access,
    requiresEnrollment: Boolean(row.course_id),
    courseSlug: row.course_slug || null,
    attempts,
    inProgressAttemptId: inProgress?.id || null,
    serverNow: nowIso(),
  });
});

export const beginAttempt = asyncHandler(async (req, res) => {
  const result = startAttempt(req.user, req.params.id);
  const state = attemptState(result.attempt.id, req.user);
  return sendData(res, { ...state, resumed: result.resumed, expired: result.expired }, result.resumed ? 200 : 201);
});

export const getAttempt = asyncHandler(async (req, res) => {
  return sendData(res, attemptState(req.params.attemptId, req.user));
});

const answersSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOption: z.string().nullable().optional(),
      numericAnswer: z.string().nullable().optional(),
      markedForReview: z.boolean().optional(),
      clearResponse: z.boolean().optional(),
      timeSpentSeconds: z.coerce.number().min(0).max(36000).optional(),
    }),
  ).min(1).max(500),
});

export const patchAttempt = asyncHandler(async (req, res) => {
  const result = saveAnswers(req.params.attemptId, req.user, req.body.answers);
  return sendData(res, result);
});

export const finishAttempt = asyncHandler(async (req, res) => {
  return sendData(res, submitAttempt(req.params.attemptId, req.user));
});

export const resultDetail = asyncHandler(async (req, res) => {
  return sendData(res, getResultDetail(req.params.resultId, req.user));
});

export const leaderboard = asyncHandler(async (req, res) => {
  const test = get('SELECT id, title, total_marks, exam FROM tests WHERE id = ?', req.params.id);
  if (!test) throw ApiError.notFound('Test not found.');
  return sendData(res, { test: { id: test.id, title: test.title, totalMarks: test.total_marks, exam: test.exam }, leaderboard: testLeaderboard(test.id) });
});

export const myTestAttempts = asyncHandler(async (req, res) => {
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

export const publicResults = asyncHandler(async (_req, res) => {
  const results = all(
    `SELECT r.score, r.max_marks, r.accuracy, r.created_at, u.name, u.avatar_color,
      t.title AS test_title, t.exam
     FROM results r JOIN users u ON u.id = r.user_id JOIN tests t ON t.id = r.test_id
     ORDER BY (r.score * 1.0 / r.max_marks) DESC, r.created_at DESC LIMIT 12`,
  ).map((r) => ({
    studentName: r.name,
    avatarColor: r.avatar_color,
    score: r.score,
    maxMarks: r.max_marks,
    percent: r.max_marks ? Math.round((r.score / r.max_marks) * 1000) / 10 : 0,
    accuracy: r.accuracy,
    testTitle: r.test_title,
    exam: r.exam,
    createdAt: r.created_at,
  }));
  const toppers = all(
    `SELECT u.name, u.avatar_color, c.title AS course_title, c.exam, r.rating, r.body
     FROM reviews r JOIN users u ON u.id = r.user_id JOIN courses c ON c.id = r.course_id
     WHERE r.rating = 5 AND r.body IS NOT NULL AND LENGTH(r.body) > 40
     ORDER BY r.created_at DESC LIMIT 6`,
  );
  return sendData(res, { results, successStories: toppers });
});
