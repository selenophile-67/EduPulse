import crypto from 'node:crypto';
import { all, get, run, transaction } from '../config/db.js';
import { ApiError } from '../utils/http.js';
import { nowIso, parseJson } from '../utils/misc.js';
import { hasCourseAccess } from './access.service.js';
import { createNotification } from './notification.service.js';

function assertStudent(user) {
  if (user.role !== 'student') {
    throw ApiError.forbidden('Only student accounts can attempt tests.');
  }
}

function getPublishedTest(testId) {
  const test = get(
    `SELECT t.*, u.name AS teacher_name,
      (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count
     FROM tests t JOIN users u ON u.id = t.created_by
     WHERE t.id = ? AND t.status = 'published'`,
    testId,
  );
  if (!test) throw ApiError.notFound('This test is not available.');
  return test;
}

function getAttemptForUser(attemptId, user) {
  const attempt = get('SELECT * FROM test_attempts WHERE id = ?', attemptId);
  if (!attempt) throw ApiError.notFound('Attempt not found.');
  if (attempt.user_id !== user.id && user.role !== 'admin') {
    throw ApiError.forbidden('This attempt belongs to another student.');
  }
  return attempt;
}

export function listQuestionsForExam(testId) {
  return all(
    `SELECT id, subject, chapter, type, text, options, marks, negative_marks, position
     FROM questions WHERE test_id = ? ORDER BY position ASC`,
    testId,
  ).map((q) => ({
    id: q.id,
    subject: q.subject,
    chapter: q.chapter,
    type: q.type,
    text: q.text,
    options: parseJson(q.options, []).map((opt) => ({ id: opt.id, text: opt.text })),
    marks: q.marks,
    negativeMarks: q.negative_marks,
    position: q.position,
  }));
}

export function startAttempt(user, testId) {
  assertStudent(user);
  const test = getPublishedTest(testId);
  if (test.course_id && !hasCourseAccess(user, test.course_id)) {
    throw ApiError.forbidden('This test is part of a course. Enroll in the course to attempt it.');
  }
  const now = Date.now();
  if (test.start_at && new Date(test.start_at).getTime() > now) {
    throw ApiError.badRequest('This test has not started yet.');
  }
  if (test.end_at && new Date(test.end_at).getTime() < now) {
    throw ApiError.badRequest('This test window has closed.');
  }

  const existing = get(
    `SELECT * FROM test_attempts WHERE test_id = ? AND user_id = ? AND status = 'in_progress'
     ORDER BY started_at DESC LIMIT 1`,
    testId,
    user.id,
  );
  if (existing) {
    if (new Date(existing.expires_at).getTime() <= now) {
      finalizeAttempt(existing.id, user);
      const finished = get('SELECT id FROM test_attempts WHERE id = ?', existing.id);
      return { attempt: finished, resumed: false, expired: true };
    }
    return { attempt: existing, resumed: true, expired: false };
  }

  const attemptId = crypto.randomUUID();
  const startedAt = new Date(now).toISOString();
  const expiresAt = new Date(now + test.duration_minutes * 60 * 1000).toISOString();
  transaction(() => {
    run(
      `INSERT INTO test_attempts (id, test_id, user_id, status, started_at, expires_at)
       VALUES (?, ?, ?, 'in_progress', ?, ?)`,
      attemptId,
      testId,
      user.id,
      startedAt,
      expiresAt,
    );
    const questions = all('SELECT id FROM questions WHERE test_id = ?', testId);
    for (const q of questions) {
      run(
        `INSERT INTO attempt_answers (attempt_id, question_id, marked_for_review, visited, time_spent_seconds, updated_at)
         VALUES (?, ?, 0, 0, 0, ?)`,
        attemptId,
        q.id,
        startedAt,
      );
    }
  });
  return { attempt: get('SELECT * FROM test_attempts WHERE id = ?', attemptId), resumed: false, expired: false };
}

export function attemptState(attemptId, user) {
  const attempt = getAttemptForUser(attemptId, user);
  if (attempt.status === 'in_progress' && new Date(attempt.expires_at).getTime() <= Date.now()) {
    finalizeAttempt(attempt.id, user);
    return { ...getAttemptPayload(attempt.id, user), autoSubmitted: true };
  }
  return getAttemptPayload(attempt.id, user);
}

export function getAttemptPayload(attemptId, user) {
  const attempt = getAttemptForUser(attemptId, user);
  const test = getPublishedTest(attempt.test_id);
  const answers = all('SELECT * FROM attempt_answers WHERE attempt_id = ?', attemptId);
  const answerMap = {};
  for (const a of answers) {
    answerMap[a.question_id] = {
      selectedOption: a.selected_option,
      numericAnswer: a.numeric_answer,
      markedForReview: Boolean(a.marked_for_review),
      visited: Boolean(a.visited),
      timeSpentSeconds: a.time_spent_seconds,
    };
  }
  return {
    attempt: {
      id: attempt.id,
      testId: attempt.test_id,
      status: attempt.status,
      startedAt: attempt.started_at,
      expiresAt: attempt.expires_at,
      submittedAt: attempt.submitted_at,
    },
    test: {
      id: test.id,
      title: test.title,
      exam: test.exam,
      durationMinutes: test.duration_minutes,
      totalMarks: test.total_marks,
      negativeMarking: test.negative_marking,
      instructions: parseJson(test.instructions, []),
    },
    questions: attempt.status === 'in_progress' ? listQuestionsForExam(test.id) : [],
    answers: answerMap,
    serverNow: nowIso(),
  };
}

export function saveAnswers(attemptId, user, updates) {
  const attempt = getAttemptForUser(attemptId, user);
  if (attempt.status !== 'in_progress') {
    throw new ApiError(409, 'ATTEMPT_CLOSED', 'This attempt has already been submitted.');
  }
  if (new Date(attempt.expires_at).getTime() <= Date.now()) {
    finalizeAttempt(attempt.id, user);
    throw new ApiError(409, 'ATTEMPT_EXPIRED', 'Time is over. Your test has been submitted automatically.');
  }
  const questions = all('SELECT id, options, type FROM questions WHERE test_id = ?', attempt.test_id);
  const valid = new Map(questions.map((q) => [q.id, q]));
  const timestamp = nowIso();

  transaction(() => {
    for (const update of updates) {
      const question = valid.get(update.questionId);
      if (!question) continue;
      let selected = update.selectedOption ?? null;
      if (selected !== null) {
        const optionIds = parseJson(question.options, []).map((o) => o.id);
        if (!optionIds.includes(selected)) selected = null;
      }
      if (update.clearResponse) {
        run(
          `UPDATE attempt_answers
           SET selected_option = NULL,
               numeric_answer = NULL,
               marked_for_review = ?,
               visited = 1,
               time_spent_seconds = COALESCE(?, time_spent_seconds),
               updated_at = ?
           WHERE attempt_id = ? AND question_id = ?`,
          update.markedForReview ? 1 : 0,
          update.timeSpentSeconds ?? null,
          timestamp,
          attemptId,
          update.questionId,
        );
        continue;
      }
      run(
        `UPDATE attempt_answers
         SET selected_option = COALESCE(?, selected_option),
             numeric_answer = COALESCE(?, numeric_answer),
             marked_for_review = ?,
             visited = 1,
             time_spent_seconds = COALESCE(?, time_spent_seconds),
             updated_at = ?
         WHERE attempt_id = ? AND question_id = ?`,
        selected,
        update.numericAnswer === undefined ? null : update.numericAnswer,
        update.markedForReview ? 1 : 0,
        update.timeSpentSeconds ?? null,
        timestamp,
        attemptId,
        update.questionId,
      );
    }
  });
  return { savedAt: timestamp };
}

export function submitAttempt(attemptId, user) {
  const attempt = getAttemptForUser(attemptId, user);
  if (attempt.status !== 'in_progress') {
    const result = get('SELECT * FROM results WHERE attempt_id = ?', attemptId);
    return { alreadySubmitted: true, resultId: result?.id || null };
  }
  finalizeAttempt(attempt.id, user);
  const result = get('SELECT * FROM results WHERE attempt_id = ?', attemptId);
  return { alreadySubmitted: false, resultId: result?.id || null };
}

export function finalizeAttempt(attemptId, user) {
  const attempt = get('SELECT * FROM test_attempts WHERE id = ?', attemptId);
  if (!attempt || attempt.status !== 'in_progress') return;
  const test = get('SELECT * FROM tests WHERE id = ?', attempt.test_id);
  const questions = all('SELECT * FROM questions WHERE test_id = ? ORDER BY position', test.id);
  const answers = all('SELECT * FROM attempt_answers WHERE attempt_id = ?', attemptId);
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));

  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unattemptedCount = 0;
  const subjectStats = new Map();
  const chapterStats = new Map();

  const ensureSubject = (subject) => {
    if (!subjectStats.has(subject)) {
      subjectStats.set(subject, { subject, total: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0, maxMarks: 0 });
    }
    return subjectStats.get(subject);
  };
  const ensureChapter = (chapter) => {
    const key = chapter || 'General';
    if (!chapterStats.has(key)) {
      chapterStats.set(key, { chapter: key, total: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0, maxMarks: 0 });
    }
    return chapterStats.get(key);
  };

  for (const q of questions) {
    const answer = answerMap.get(q.id);
    const subject = ensureSubject(q.subject);
    const chapter = ensureChapter(q.chapter);
    subject.total += 1;
    subject.maxMarks += q.marks;
    chapter.total += 1;
    chapter.maxMarks += q.marks;

    const isAttempted =
      q.type === 'mcq'
        ? Boolean(answer?.selected_option)
        : answer?.numeric_answer !== null && answer?.numeric_answer !== undefined && answer?.numeric_answer !== '';

    let isCorrect = false;
    if (isAttempted) {
      if (q.type === 'mcq') {
        isCorrect = String(answer.selected_option) === String(q.correct_answer);
      } else {
        const given = Number(answer.numeric_answer);
        const expected = Number(q.correct_answer);
        isCorrect = Number.isFinite(given) && Math.abs(given - expected) <= (q.tolerance || 0);
      }
    }

    if (!isAttempted) {
      unattemptedCount += 1;
      subject.unattempted += 1;
      chapter.unattempted += 1;
    } else if (isCorrect) {
      correctCount += 1;
      score += q.marks;
      subject.correct += 1;
      subject.score += q.marks;
      chapter.correct += 1;
      chapter.score += q.marks;
    } else {
      incorrectCount += 1;
      score -= q.negative_marks || 0;
      subject.incorrect += 1;
      subject.score -= q.negative_marks || 0;
      chapter.incorrect += 1;
      chapter.score -= q.negative_marks || 0;
    }
  }

  const submittedAt = nowIso();
  const started = new Date(attempt.started_at).getTime();
  const expires = new Date(attempt.expires_at).getTime();
  const now = Date.now();
  const timeTakenSeconds = Math.max(0, Math.round((Math.min(now, expires) - started) / 1000));
  const status = now > expires ? 'expired' : 'submitted';
  const accuracy = correctCount + incorrectCount > 0 ? (correctCount / (correctCount + incorrectCount)) * 100 : 0;
  const maxMarks = questions.reduce((sum, q) => sum + q.marks, 0);
  const resultId = crypto.randomUUID();

  transaction(() => {
    run(
      `UPDATE test_attempts SET status = ?, submitted_at = ?, score = ?, correct_count = ?,
       incorrect_count = ?, unattempted_count = ?, time_taken_seconds = ? WHERE id = ?`,
      status,
      submittedAt,
      Math.round(score * 100) / 100,
      correctCount,
      incorrectCount,
      unattemptedCount,
      timeTakenSeconds,
      attemptId,
    );

    const submitted = all(
      `SELECT r.user_id, r.score, a.time_taken_seconds FROM results r
       JOIN test_attempts a ON a.id = r.attempt_id
       WHERE r.test_id = ? AND r.user_id != ?`,
      test.id,
      attempt.user_id,
    );
    const better = submitted.filter(
      (r) => r.score > score || (r.score === score && r.time_taken_seconds < timeTakenSeconds),
    ).length;
    const rank = better + 1;
    const totalAttempts = submitted.length + 1;
    const below = submitted.filter((r) => r.score < score).length;
    const percentile = totalAttempts > 1 ? Math.round((below / (totalAttempts - 1)) * 1000) / 10 : null;

    run(
      `INSERT INTO results (id, attempt_id, test_id, user_id, score, max_marks, accuracy, rank, percentile,
        subject_breakdown, chapter_breakdown, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      resultId,
      attemptId,
      test.id,
      attempt.user_id,
      Math.round(score * 100) / 100,
      maxMarks,
      Math.round(accuracy * 10) / 10,
      rank,
      percentile,
      JSON.stringify([...subjectStats.values()]),
      JSON.stringify([...chapterStats.values()]),
      submittedAt,
    );
  });

  createNotification(attempt.user_id, {
    type: 'test_result',
    title: `Result published: ${test.title}`,
    body: `You scored ${Math.round(score * 100) / 100} / ${maxMarks} (rank ${get('SELECT rank FROM results WHERE id = ?', resultId)?.rank}).`,
    link: `/dashboard/results/${resultId}`,
  });
}

export function getResultDetail(resultId, user) {
  const result = get(
    `SELECT r.*, t.title AS test_title, t.exam, t.type AS test_type, t.duration_minutes,
      u.name AS student_name, a.started_at, a.submitted_at, a.time_taken_seconds, a.status AS attempt_status
     FROM results r
     JOIN tests t ON t.id = r.test_id
     JOIN users u ON u.id = r.user_id
     JOIN test_attempts a ON a.id = r.attempt_id
     WHERE r.id = ?`,
    resultId,
  );
  if (!result) throw ApiError.notFound('Result not found.');
  if (result.user_id !== user.id && user.role !== 'admin') {
    const ownsTest = user.role === 'teacher' && get('SELECT created_by FROM tests WHERE id = ?', result.test_id)?.created_by === user.id;
    if (!ownsTest) throw ApiError.forbidden('You cannot view this result.');
  }
  const questions = all('SELECT * FROM questions WHERE test_id = ? ORDER BY position', result.test_id);
  const answers = all('SELECT * FROM attempt_answers WHERE attempt_id = ?', result.attempt_id);
  const answerMap = new Map(answers.map((a) => [a.question_id, a]));
  return {
    id: result.id,
    test: {
      id: result.test_id,
      title: result.test_title,
      exam: result.exam,
      type: result.test_type,
      durationMinutes: result.duration_minutes,
    },
    student: { id: result.user_id, name: result.student_name },
    score: result.score,
    maxMarks: result.max_marks,
    accuracy: result.accuracy,
    rank: result.rank,
    percentile: result.percentile,
    correctCount: get('SELECT correct_count FROM test_attempts WHERE id = ?', result.attempt_id)?.correct_count,
    incorrectCount: get('SELECT incorrect_count FROM test_attempts WHERE id = ?', result.attempt_id)?.incorrect_count,
    unattemptedCount: get('SELECT unattempted_count FROM test_attempts WHERE id = ?', result.attempt_id)?.unattempted_count,
    timeTakenSeconds: result.time_taken_seconds,
    submittedAt: result.submitted_at,
    attemptStatus: result.attempt_status,
    subjectBreakdown: parseJson(result.subject_breakdown, []),
    chapterBreakdown: parseJson(result.chapter_breakdown, []),
    questions: questions.map((q) => {
      const answer = answerMap.get(q.id);
      const isAttempted =
        q.type === 'mcq'
          ? Boolean(answer?.selected_option)
          : answer?.numeric_answer !== null && answer?.numeric_answer !== undefined && answer?.numeric_answer !== '';
      let isCorrect = false;
      if (isAttempted) {
        if (q.type === 'mcq') isCorrect = String(answer.selected_option) === String(q.correct_answer);
        else {
          const given = Number(answer.numeric_answer);
          const expected = Number(q.correct_answer);
          isCorrect = Number.isFinite(given) && Math.abs(given - expected) <= (q.tolerance || 0);
        }
      }
      return {
        id: q.id,
        subject: q.subject,
        chapter: q.chapter,
        type: q.type,
        text: q.text,
        options: parseJson(q.options, []),
        correctAnswer: q.correct_answer,
        tolerance: q.tolerance,
        explanation: q.explanation,
        marks: q.marks,
        negativeMarks: q.negative_marks,
        selectedOption: answer?.selected_option ?? null,
        numericAnswer: answer?.numeric_answer ?? null,
        isAttempted,
        isCorrect,
        markedForReview: Boolean(answer?.marked_for_review),
      };
    }),
  };
}

export function testLeaderboard(testId) {
  const rows = all(
    `SELECT r.rank, r.score, r.max_marks, r.percentile, u.name, u.avatar_color, a.time_taken_seconds
     FROM results r JOIN users u ON u.id = r.user_id JOIN test_attempts a ON a.id = r.attempt_id
     WHERE r.test_id = ? ORDER BY r.rank ASC LIMIT 20`,
    testId,
  );
  return rows.map((r) => ({
    rank: r.rank,
    name: r.name,
    avatarColor: r.avatar_color,
    score: r.score,
    maxMarks: r.max_marks,
    percentile: r.percentile,
    timeTakenSeconds: r.time_taken_seconds,
  }));
}
