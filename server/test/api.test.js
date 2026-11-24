import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import request from 'supertest';

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'edupulse-test-'));
const dbPath = path.join(tempDir, 'test.db');

process.env.EDUPULSE_TEST = 'true';
process.env.DB_PATH = dbPath;

let app;
let db;

before(async () => {
  const seeded = spawnSync(process.execPath, ['seed/seed.js'], {
    cwd: process.cwd(),
    env: { ...process.env, EDUPULSE_TEST: 'true', DB_PATH: dbPath },
    encoding: 'utf8',
  });
  if (seeded.status !== 0) throw new Error(`Seed failed: ${seeded.stderr || seeded.stdout}`);

  ({ default: app } = await import('../server.js'));
  db = await import('../config/db.js');
});

after(() => {
  try {
    db?.db?.close();
  } catch {
    /* already closed */
  }
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    /* Windows may keep the WAL file locked briefly */
  }
});

async function login(email, password) {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, `login failed for ${email}: ${res.text}`);
  return agent;
}

const student = () => login('student@edupulse.demo', 'Student@123');
const teacher = () => login('teacher@edupulse.demo', 'Teacher@123');
const admin = () => login('admin@edupulse.demo', 'Admin@123');

test('health endpoint responds without authentication', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.status, 'ok');
});

test('content config reports integration honesty notes', async () => {
  const res = await request(app).get('/api/content/config');
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.data.integrations, 'object');
  assert.match(res.body.data.notes.payments, /not configured|gateway/i);
});

test('login sets a session cookie and returns the user without secrets', async () => {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email: 'student@edupulse.demo', password: 'Student@123' });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.role, 'student');
  assert.equal(res.body.data.user.password_hash, undefined);
  assert.match(res.headers['set-cookie'][0], /HttpOnly/i);

  const me = await agent.get('/api/auth/me');
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, 'student@edupulse.demo');
});

test('login rejects a wrong password', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'student@edupulse.demo', password: 'wrong-pass1' });
  assert.equal(res.status, 401);
  assert.equal(res.body.error.code, 'UNAUTHORIZED');
});

test('unauthenticated requests to protected routes are rejected', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
});

test('CSRF guard blocks mutating requests from a foreign origin', async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .set('Origin', 'https://evil.example.com')
    .send({ email: 'student@edupulse.demo', password: 'Student@123' });
  assert.equal(res.status, 403);
  assert.equal(res.body.error.code, 'CSRF_BLOCKED');
});

test('role-based access control separates student, teacher and admin areas', async () => {
  const s = await student();
  assert.equal((await s.get('/api/teacher/overview')).status, 403);
  assert.equal((await s.get('/api/admin/overview')).status, 403);

  const t = await teacher();
  assert.equal((await t.get('/api/teacher/overview')).status, 200);
  assert.equal((await t.get('/api/admin/overview')).status, 403);

  const a = await admin();
  assert.equal((await a.get('/api/admin/overview')).status, 200);
});

test('paid enrollment is refused with 402 and never grants access', async () => {
  const agent = request.agent(app);
  const email = `paid-${Date.now()}@example.com`;
  assert.equal((await agent.post('/api/auth/register').send({ name: 'Paid Seeker', email, password: 'Passw0rd1' })).status, 201);

  const paid = db.get("SELECT id, title FROM courses WHERE status = 'published' AND price_cents > 0 AND deleted_at IS NULL LIMIT 1");
  assert.ok(paid, 'expected a paid course in seed data');

  const res = await agent.post('/api/enrollments').send({ courseId: paid.id });
  assert.equal(res.status, 402);
  assert.equal(res.body.error.code, 'PAYMENT_REQUIRED');

  const mine = await agent.get('/api/enrollments/mine');
  assert.equal(mine.status, 200);
  assert.ok(!mine.body.data.enrollments.some((e) => e.courseId === paid.id));
});

test('free course enrollment works end to end', async () => {
  const agent = request.agent(app);
  const email = `free-enroll-${Date.now()}@example.com`;
  const registered = await agent.post('/api/auth/register').send({ name: 'Free Learner', email, password: 'Passw0rd1' });
  assert.equal(registered.status, 201, registered.text);

  const free = db.get("SELECT id FROM courses WHERE status = 'published' AND price_cents = 0 AND deleted_at IS NULL LIMIT 1");
  const res = await agent.post('/api/enrollments').send({ courseId: free.id });
  assert.equal(res.status, 201);

  const mine = await agent.get('/api/enrollments/mine');
  assert.ok(mine.body.data.enrollments.some((e) => e.courseId === free.id));

  const again = await agent.post('/api/enrollments').send({ courseId: free.id });
  assert.equal(again.body.data.alreadyEnrolled, true);
});

test('admin checkout probe always reports payments as not configured', async () => {
  const a = await admin();
  const res = await a.post('/api/admin/payments/checkout').send({});
  assert.equal(res.status, 503);
  assert.equal(res.body.error.code, 'NOT_CONFIGURED');
});

test('test engine scores answers server-side and locks the attempt after submit', async () => {
  const agent = request.agent(app);
  const email = `attempt-${Date.now()}@example.com`;
  assert.equal((await agent.post('/api/auth/register').send({ name: 'Attempt Taker', email, password: 'Passw0rd1' })).status, 201);

  const testRow = db.get(
    `SELECT t.* FROM tests t
     JOIN courses c ON c.id = t.course_id
     WHERE t.status = 'published' AND c.price_cents = 0 AND c.status = 'published'
       AND (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) >= 3
     LIMIT 1`,
  );
  assert.ok(testRow, 'expected a published test on a free course');
  assert.equal((await agent.post('/api/enrollments').send({ courseId: testRow.course_id })).status, 201);

  const started = await agent.post(`/api/tests/${testRow.id}/attempts`).send({});
  assert.equal(started.status, 201, started.text);
  const { attempt, questions } = started.body.data;
  assert.equal(attempt.status, 'in_progress');
  assert.ok(questions.length >= 3);
  assert.equal(questions[0].correctAnswer, undefined, 'correct answers must not leak before submit');

  const mcqs = db.all("SELECT * FROM questions WHERE test_id = ? AND type = 'mcq' ORDER BY position LIMIT 3", testRow.id);
  assert.equal(mcqs.length, 3);

  const answers = [
    { questionId: mcqs[0].id, selectedOption: mcqs[0].correct_answer, markedForReview: true },
    { questionId: mcqs[1].id, selectedOption: mcqs[1].correct_answer },
    { questionId: mcqs[2].id, selectedOption: mcqs[2].correct_answer === 'a' ? 'b' : 'a' },
  ];
  const patched = await agent.patch(`/api/tests/attempts/${attempt.id}`).send({ answers });
  assert.equal(patched.status, 200, patched.text);

  const state = await agent.get(`/api/tests/attempts/${attempt.id}`);
  assert.equal(state.body.data.answers[mcqs[0].id].selectedOption, mcqs[0].correct_answer);
  assert.equal(state.body.data.answers[mcqs[0].id].markedForReview, true);

  const cleared = await agent.patch(`/api/tests/attempts/${attempt.id}`).send({
    answers: [{ questionId: mcqs[1].id, clearResponse: true }],
  });
  assert.equal(cleared.status, 200);
  assert.equal((await agent.get(`/api/tests/attempts/${attempt.id}`)).body.data.answers[mcqs[1].id].selectedOption, null);

  await agent.patch(`/api/tests/attempts/${attempt.id}`).send({
    answers: [{ questionId: mcqs[1].id, selectedOption: mcqs[1].correct_answer }],
  });

  const submitted = await agent.post(`/api/tests/attempts/${attempt.id}/submit`).send({});
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.data.alreadySubmitted, false);
  const resultId = submitted.body.data.resultId;
  assert.ok(resultId);

  const expectedScore = mcqs[0].marks + mcqs[1].marks - (mcqs[2].negative_marks || 0);
  const result = await agent.get(`/api/tests/results/${resultId}`);
  assert.equal(result.status, 200, result.text);
  assert.equal(result.body.data.score, expectedScore);
  assert.equal(result.body.data.correctCount, 2);
  assert.equal(result.body.data.incorrectCount, 1);
  assert.equal(result.body.data.accuracy, 66.7);
  assert.ok(result.body.data.questions.every((q) => q.correctAnswer !== undefined && q.explanation !== undefined));

  const patchedAfterSubmit = await agent.patch(`/api/tests/attempts/${attempt.id}`).send({
    answers: [{ questionId: mcqs[0].id, selectedOption: mcqs[0].correct_answer }],
  });
  assert.equal(patchedAfterSubmit.status, 409);
  assert.equal(patchedAfterSubmit.body.error.code, 'ATTEMPT_CLOSED');

  const resubmitted = await agent.post(`/api/tests/attempts/${attempt.id}/submit`).send({});
  assert.equal(resubmitted.status, 200);
  assert.equal(resubmitted.body.data.alreadySubmitted, true);
  assert.equal(resubmitted.body.data.resultId, resultId);
});

test('the server enforces attempt expiry and auto-submits', async () => {
  const agent = request.agent(app);
  const email = `expiry-${Date.now()}@example.com`;
  assert.equal((await agent.post('/api/auth/register').send({ name: 'Expiry Taker', email, password: 'Passw0rd1' })).status, 201);

  const testRow = db.get(
    `SELECT t.* FROM tests t
     JOIN courses c ON c.id = t.course_id
     WHERE t.status = 'published' AND c.price_cents = 0 AND c.status = 'published'
       AND (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) >= 3
     LIMIT 1`,
  );
  await agent.post('/api/enrollments').send({ courseId: testRow.course_id });

  const started = await agent.post(`/api/tests/${testRow.id}/attempts`).send({});
  const attemptId = started.body.data.attempt.id;
  db.run('UPDATE test_attempts SET expires_at = ? WHERE id = ?', new Date(Date.now() - 60_000).toISOString(), attemptId);

  const late = await agent.patch(`/api/tests/attempts/${attemptId}`).send({
    answers: [{ questionId: started.body.data.questions[0].id, selectedOption: 'a' }],
  });
  assert.equal(late.status, 409);
  assert.equal(late.body.error.code, 'ATTEMPT_EXPIRED');

  const closed = await agent.get(`/api/tests/attempts/${attemptId}`);
  assert.equal(closed.body.data.attempt.status, 'expired');
  assert.equal(closed.body.data.questions.length, 0);
  assert.ok(db.get('SELECT id FROM results WHERE attempt_id = ?', attemptId));
});

test('admin can approve a pending educator and the educator then manages courses', async () => {
  const a = await admin();
  const pending = await a.get('/api/admin/teachers/pending');
  assert.equal(pending.status, 200);
  const application = pending.body.data.teachers.find((t) => t.email === 'karan.bhatt@edupulse.demo');
  assert.ok(application, 'seeded pending teacher should be listed');

  const approved = await a.post(`/api/admin/teachers/${application.id}/approve`).send({});
  assert.equal(approved.status, 200, approved.text);

  const teacherAgent = await login('karan.bhatt@edupulse.demo', 'Teacher@123');
  const overview = await teacherAgent.get('/api/teacher/overview');
  assert.equal(overview.status, 200);
  const courses = await teacherAgent.get('/api/teacher/courses');
  assert.equal(courses.status, 200);
});

test('admin cannot publish a course that has no lectures', async () => {
  const t = await login('karan.bhatt@edupulse.demo', 'Teacher@123');
  const created = await t.post('/api/teacher/courses').send({
    title: 'Draft Course Without Lectures',
    description: 'A freshly created draft course used to verify the server-side publish guard end to end.',
    category: 'jee',
    exam: 'JEE Main',
    priceCents: 0,
  });
  assert.equal(created.status, 201, created.text);
  const courseId = created.body.data.course.id;

  const a = await admin();
  const res = await a.patch(`/api/admin/courses/${courseId}`).send({ status: 'published' });
  assert.equal(res.status, 400);
  assert.match(res.body.error.message, /lecture/i);

  const stillDraft = db.get('SELECT status FROM courses WHERE id = ?', courseId);
  assert.equal(stillDraft.status, 'draft');
});
