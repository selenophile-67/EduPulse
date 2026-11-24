import { all, get } from '../config/db.js';
import { asyncHandler, sendData } from '../utils/http.js';
import { mapCourse, mapMaterial, mapTest } from '../models/serialize.js';
import { COURSE_SELECT } from '../models/courses.js';

export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    return sendData(res, {
      query: q,
      courses: [],
      educators: [],
      materials: [],
      tests: [],
      lectures: [],
      totals: { courses: 0, educators: 0, materials: 0, tests: 0, lectures: 0 },
    });
  }
  const term = `%${q}%`;

  const courses = all(
    `${COURSE_SELECT} WHERE c.status = 'published' AND c.deleted_at IS NULL
     AND (c.title LIKE ? OR c.subtitle LIKE ? OR c.exam LIKE ? OR c.description LIKE ? OR u.name LIKE ?)
     ORDER BY (CASE WHEN c.title LIKE ? THEN 0 ELSE 1 END), enrolled_count DESC LIMIT 6`,
    term,
    term,
    term,
    term,
    term,
    `${q}%`,
  ).map(mapCourse);

  const educators = all(
    `SELECT u.id, u.name, u.avatar_color, tp.headline, tp.experience_years, tp.subjects,
      (SELECT COUNT(*) FROM courses c WHERE c.teacher_id = u.id AND c.status = 'published' AND c.deleted_at IS NULL) AS course_count,
      (SELECT COUNT(DISTINCT e.user_id) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.teacher_id = u.id) AS student_count
     FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE u.role = 'teacher' AND u.deleted_at IS NULL AND u.status = 'active'
     AND (u.name LIKE ? OR tp.headline LIKE ? OR tp.subjects LIKE ?)
     LIMIT 5`,
    term,
    term,
    term,
  ).map((e) => ({
    id: e.id,
    name: e.name,
    avatarColor: e.avatar_color,
    headline: e.headline,
    experienceYears: e.experience_years,
    subjects: e.subjects,
    courseCount: e.course_count,
    studentCount: e.student_count,
  }));

  const materials = all(
    `SELECT m.*, c.title AS course_title FROM study_materials m LEFT JOIN courses c ON c.id = m.course_id
     WHERE (m.title LIKE ? OR m.subject LIKE ? OR m.chapter_name LIKE ? OR m.description LIKE ?)
     ORDER BY m.download_count DESC LIMIT 6`,
    term,
    term,
    term,
    term,
  ).map((m) => mapMaterial(m));

  const tests = all(
    `SELECT t.*, (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS question_count,
      (SELECT COUNT(*) FROM test_attempts a WHERE a.test_id = t.id) AS attempt_count
     FROM tests t WHERE t.status = 'published' AND (t.title LIKE ? OR t.exam LIKE ? OR t.description LIKE ?)
     LIMIT 6`,
    term,
    term,
    term,
  ).map(mapTest);

  const lectures = all(
    `SELECT l.id, l.title, l.duration_seconds, c.title AS course_title, c.slug AS course_slug, c.id AS course_id
     FROM lectures l JOIN courses c ON c.id = l.course_id
     WHERE c.status = 'published' AND c.deleted_at IS NULL AND l.title LIKE ? LIMIT 6`,
    term,
  ).map((l) => ({
    id: l.id,
    title: l.title,
    durationSeconds: l.duration_seconds,
    courseTitle: l.course_title,
    courseSlug: l.course_slug,
    courseId: l.course_id,
  }));

  return sendData(res, {
    query: q,
    courses,
    educators,
    materials,
    tests,
    lectures,
    totals: {
      courses: courses.length,
      educators: educators.length,
      materials: materials.length,
      tests: tests.length,
      lectures: lectures.length,
    },
  });
});

export const searchSuggestions = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 1) return sendData(res, { suggestions: [] });
  const term = `${q}%`;
  const contains = `%${q}%`;
  const courses = all(
    `SELECT title AS label, 'course' AS type, slug AS target FROM courses
     WHERE status = 'published' AND deleted_at IS NULL AND title LIKE ? ORDER BY created_at DESC LIMIT 4`,
    term,
  );
  const exams = all(
    `SELECT DISTINCT exam AS label, 'exam' AS type, exam AS target FROM courses
     WHERE status = 'published' AND exam LIKE ? LIMIT 2`,
    contains,
  );
  const titles = all(
    `SELECT title AS label, 'test' AS type, id AS target FROM tests
     WHERE status = 'published' AND title LIKE ? LIMIT 2`,
    term,
  );
  const educators = all(
    `SELECT name AS label, 'educator' AS type, id AS target FROM users
     WHERE role = 'teacher' AND name LIKE ? LIMIT 2`,
    term,
  );
  const materials = all(
    `SELECT title AS label, 'material' AS type, id AS target FROM study_materials WHERE title LIKE ? LIMIT 2`,
    term,
  );
  const suggestions = [
    ...courses.map((c) => ({ ...c, href: `/courses/${c.target}` })),
    ...exams.map((e) => ({ label: `${e.label} courses`, type: 'exam', href: `/courses?exam=${encodeURIComponent(e.target)}` })),
    ...titles.map((t) => ({ label: t.label, type: t.type, href: `/tests/${t.target}` })),
    ...educators.map((e) => ({ label: e.label, type: e.type, href: `/search?q=${encodeURIComponent(e.label)}` })),
    ...materials.map((m) => ({ label: m.label, type: m.type, href: `/materials?highlight=${m.target}` })),
  ].slice(0, 8);
  return sendData(res, { suggestions });
});

export const popularSearches = asyncHandler(async (_req, res) => {
  const categories = all(
    `SELECT cat.name, COUNT(c.id) AS course_count FROM categories cat
     LEFT JOIN courses c ON c.category = cat.slug AND c.status = 'published'
     GROUP BY cat.slug ORDER BY course_count DESC LIMIT 6`,
  );
  const exams = all(
    `SELECT exam, COUNT(*) AS count FROM courses WHERE status = 'published' AND deleted_at IS NULL
     GROUP BY exam ORDER BY count DESC LIMIT 4`,
  );
  return sendData(res, {
    popular: [
      ...categories.map((c) => ({ label: c.name, href: `/courses?category=${encodeURIComponent(c.name.toLowerCase())}` })),
      ...exams.map((e) => ({ label: e.exam, href: `/courses?exam=${encodeURIComponent(e.exam)}` })),
    ],
  });
});
