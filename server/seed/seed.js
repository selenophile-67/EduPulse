import crypto from 'node:crypto';
import { all, get, run, transaction } from '../config/db.js';
import { hashPassword } from '../utils/auth.js';
import { categories, teachers, pendingTeacher, courses, materials, faqs, banners, reviewSeeds, studentNames } from './data.js';
import { questionBanks, tests as testDefs } from './questions.js';
import { ensureDemoVideos, generateMaterialPdf } from './media.js';

const DAY = 86_400_000;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString();
const daysAgo = (days) => iso(now - Math.round(days * DAY));
const uuid = () => crypto.randomUUID();
const AVATAR_COLORS = ['#F97316', '#10B981', '#6366F1', '#EC4899', '#0EA5E9', '#8B5CF6', '#F59E0B', '#14B8A6', '#EF4444', '#84CC16'];
const THUMBNAIL_THEMES = ['navy', 'orange', 'emerald', 'sky', 'violet', 'rose', 'amber', 'teal', 'indigo', 'fuchsia'];
const DEMO_PASSWORD = { student: 'Student@123', teacher: 'Teacher@123', admin: 'Admin@123' };

const MATERIAL_BANKS = {
  Physics: 'physics', Mathematics: 'maths', Chemistry: 'chemistry', Biology: 'biology',
  Polity: 'polity', History: 'history', Geography: 'geography', Economy: 'general',
  'General Studies': 'general', 'Quantitative Aptitude': 'quant', English: 'english',
  Reasoning: 'reasoning', 'Banking Awareness': 'banking', Algorithms: 'algorithms',
  'Operating Systems': 'os', DBMS: 'dbms', Science: 'foundation', 'General Awareness': 'general',
};

const STRATEGY_POINTS = {
  'JEE Main': ['Attempt the easiest questions in the first pass and return to lengthy numericals later.', 'Keep a formula sheet per chapter and revise it every Sunday.', 'Analyse every mock by chapter, not just by total score.'],
  'JEE Advanced': ['Prioritise multi-concept questions that you can break into familiar steps.', 'Use partial marking consciously; a well-started solution can still earn marks.', 'Practise previous-year papers under strict three-hour conditions.'],
  'NEET UG': ['Read NCERT lines carefully; most Biology questions come directly from the text.', 'Do not over-prepare Physics beyond NEET-level numericals.', 'Revise diagrams and exception lists weekly.'],
  'UPSC CSE': ['Eliminate options using one known fact rather than trying to know everything.', 'Link every static topic to a current-affairs example.', 'Practise answer writing under timed conditions.'],
  'SSC CGL': ['Learn tables, squares and fractions to reduce calculation time.', 'Attempt reasoning sets before lengthy quant questions.', 'Review sectional timing after every mock.'],
  'IBPS PO': ['Start with the section you are most accurate in to build momentum.', 'Use approximation for data interpretation when options allow.', 'Keep a puzzle notation system and use it consistently.'],
  'GATE CSE': ['Read the exact complexity or condition asked before solving.', 'Substitute small values to eliminate options in recurrence questions.', 'Revise previous-year questions topic by topic.'],
  'CUET UG': ['Focus on speed and accuracy; CUET rewards confident elimination.', 'Read passages for structure before answering detail questions.', 'Practise domain questions with negative marking enabled.'],
  'CBSE Class 12': ['Write derivations with every step and define symbols.', 'Draw labelled diagrams where the marking scheme expects them.', 'Practise previous-year board questions under timed conditions.'],
  'CBSE Class 10': ['Balance equations and include state symbols.', 'Draw ray diagrams with arrows and labels.', 'Write numericals with formula, substitution and unit.'],
  Foundation: ['Build concepts with everyday examples before solving problems.', 'Practise a little every day rather than cramming before tests.', 'Explain what you learned aloud to check understanding.'],
};

const MISTAKES = [
  'Skipping the question stem and jumping to calculations too early.',
  'Not reviewing mistakes after a test; the same errors repeat.',
  'Studying without a time boundary and losing exam tempo.',
];

function practiceFor(material, index) {
  const bank = questionBanks[MATERIAL_BANKS[material.subject] || 'general'];
  return Array.from({ length: 3 }, (_, k) => {
    const question = bank[(index * 2 + k * 3) % bank.length];
    if (question.type === 'numerical') {
      return { q: question.text, a: `${question.answer} — ${question.explanation}` };
    }
    const answerIndex = ['a', 'b', 'c', 'd'].indexOf(question.answer);
    return { q: question.text, a: `${question.answer.toUpperCase()}) ${question.options[answerIndex]} — ${question.explanation}` };
  });
}

function materialSections(material) {
  return [
    { heading: 'Key concepts', points: material.notes },
    { heading: 'Exam strategy', points: STRATEGY_POINTS[material.exam] || STRATEGY_POINTS.Foundation },
    { heading: 'Common mistakes to avoid', points: MISTAKES },
  ];
}

function buildMaterial(material, index) {
  return {
    ...material,
    sections: materialSections(material),
    practice: practiceFor(material, index),
  };
}

function hashRatio(questionIndex, seed) {
  return ((questionIndex * 53 + seed * 17 + 11) % 97) / 100;
}

async function main() {
  console.log('[seed] Preparing demo media …');
  const videos = ensureDemoVideos();
  const materialPdfs = await Promise.all(materials.map((m, index) => generateMaterialPdf(buildMaterial(m, index))));

  console.log('[seed] Hashing demo passwords …');
  const passwordHashes = {
    student: await hashPassword(DEMO_PASSWORD.student),
    teacher: await hashPassword(DEMO_PASSWORD.teacher),
    admin: await hashPassword(DEMO_PASSWORD.admin),
  };

  const state = {
    users: new Map(),
    courses: new Map(),
    courseLectures: new Map(),
    tests: new Map(),
    materials: [],
    enrollmentSet: new Set(),
    demoResults: [],
  };

  transaction(() => {
    const tables = [
      'attempt_answers', 'results', 'test_attempts', 'questions', 'tests', 'attendance', 'live_classes',
      'lecture_progress', 'material_views', 'bookmarks', 'reviews', 'enrollments', 'lectures', 'chapters',
      'subjects', 'study_materials', 'courses', 'notifications', 'sessions', 'password_resets',
      'contact_messages', 'newsletter_subscribers', 'faqs', 'banners', 'uploads', 'student_profiles',
      'teacher_profiles', 'users', 'categories',
    ];
    for (const table of tables) run(`DELETE FROM ${table}`);
  });

  transaction(() => {
    const insertUser = ({ email, name, role, passwordHash, phone, createdAt, avatarColor, status = 'active' }) => {
      const id = uuid();
      run(
        `INSERT INTO users (id, email, phone, password_hash, role, name, avatar_color, status, email_verified, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        id, email, phone, passwordHash, role, name, avatarColor, status, createdAt, createdAt,
      );
      state.users.set(email, id);
      return id;
    };

    const adminId = insertUser({
      email: 'admin@edupulse.demo', name: 'Meera Krishnan', role: 'admin',
      passwordHash: passwordHashes.admin, phone: '9800000000', createdAt: daysAgo(180), avatarColor: '#111827',
    });

    const teacherIds = new Map();
    teachers.forEach((teacher, index) => {
      const id = insertUser({
        email: teacher.email, name: teacher.name, role: 'teacher',
        passwordHash: passwordHashes.teacher, phone: `98${String(11000000 + index * 7919).padStart(8, '0')}`,
        createdAt: daysAgo(170 - index * 4), avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
      });
      teacherIds.set(teacher.email, id);
      run(
        `INSERT INTO teacher_profiles (user_id, headline, qualification, experience_years, subjects, bio, approved)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        id, teacher.headline, teacher.qualification, teacher.experienceYears, teacher.subjects, teacher.bio,
      );
    });

    const pendingId = insertUser({
      email: pendingTeacher.email, name: pendingTeacher.name, role: 'teacher',
      passwordHash: passwordHashes.teacher, phone: '9812345670', createdAt: daysAgo(3), avatarColor: '#64748B',
    });
    run(
      `INSERT INTO teacher_profiles (user_id, headline, qualification, experience_years, subjects, bio, approved)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      pendingId, pendingTeacher.headline, pendingTeacher.qualification, pendingTeacher.experienceYears,
      pendingTeacher.subjects, 'Applied through the educator application form. Awaiting administrator review.',
    );

    const demoStudentId = insertUser({
      email: 'student@edupulse.demo', name: 'Aarav Sharma', role: 'student',
      passwordHash: passwordHashes.student, phone: '9800000001', createdAt: daysAgo(45), avatarColor: '#F97316',
    });
    run(
      `INSERT INTO student_profiles (user_id, class_level, target_exam, preferred_language, learning_goal, streak_days, last_active_date)
       VALUES (?, 'Class 12', 'JEE Main', 'English', 'Score 99+ percentile in JEE Main 2027', 12, ?)`,
      demoStudentId, daysAgo(0).slice(0, 10),
    );

    const studentIds = [demoStudentId];
    const otherStudents = studentNames.filter((name) => name !== 'Aarav Sharma').slice(0, 24);
    const examTargets = ['JEE Main', 'NEET UG', 'UPSC CSE', 'SSC CGL', 'IBPS PO', 'GATE CSE', 'CUET UG', 'CBSE Class 12', 'CBSE Class 10', 'Foundation'];
    otherStudents.forEach((name, index) => {
      const id = insertUser({
        email: `student${String(index + 1).padStart(2, '0')}@edupulse.demo`, name, role: 'student',
        passwordHash: passwordHashes.student, phone: `98${String(20000000 + index * 9173).padStart(8, '0')}`,
        createdAt: daysAgo(150 - index * 5), avatarColor: AVATAR_COLORS[(index + 3) % AVATAR_COLORS.length],
      });
      studentIds.push(id);
      run(
        `INSERT INTO student_profiles (user_id, class_level, target_exam, preferred_language, learning_goal, streak_days, last_active_date)
         VALUES (?, ?, ?, 'English', ?, ?, ?)`,
        id, index % 3 === 0 ? 'Class 12' : 'Graduate', examTargets[index % examTargets.length],
        `Prepare seriously for ${examTargets[index % examTargets.length]}`, index % 14, daysAgo(index % 6).slice(0, 10),
      );
    });

    categories.forEach((category, index) => {
      run(
        `INSERT INTO categories (slug, name, tagline, description, icon, accent, position) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        category.slug, category.name, category.tagline, category.description, category.icon, category.accent, index,
      );
    });

    const courseIds = new Map();
    let lectureCounter = 0;
    courses.forEach((course, courseIndex) => {
      const id = uuid();
      courseIds.set(course.slug, id);
      const teacherId = teacherIds.get(course.teacherEmail);
      const createdAt = daysAgo(course.createdAtDaysAgo || 30);
      run(
        `INSERT INTO courses (id, slug, title, subtitle, description, category, exam, class_level, subject_area, language, level,
          duration_weeks, price_cents, mrp_cents, thumbnail_theme, teacher_id, status, learning_objectives, target_audience,
          start_date, end_date, validity_days, batch_timings, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, course.slug, course.title, course.subtitle, course.description, course.category, course.exam,
        course.classLevel, course.subjectArea, course.language, course.level, course.durationWeeks,
        course.priceCents, course.mrpCents, THUMBNAIL_THEMES[courseIndex % THUMBNAIL_THEMES.length],
        teacherId, course.status || 'published', JSON.stringify(course.objectives), course.targetAudience,
        course.startDate, course.endDate, course.validityDays, course.batchTimings, createdAt, createdAt,
      );
      state.courses.set(course.slug, {
        id, title: course.title, teacherId, status: course.status || 'published',
        priceCents: course.priceCents, daysAgo: course.createdAtDaysAgo || 30,
      });
      state.courseLectures.set(id, []);

      course.curriculum.forEach((subject, subjectIndex) => {
        const subjectId = uuid();
        run('INSERT INTO subjects (id, course_id, name, position) VALUES (?, ?, ?, ?)', subjectId, id, subject.subject, subjectIndex);
        subject.chapters.forEach((chapter, chapterIndex) => {
          const chapterId = uuid();
          run(
            'INSERT INTO chapters (id, subject_id, course_id, name, position) VALUES (?, ?, ?, ?, ?)',
            chapterId, subjectId, id, chapter.name, chapterIndex,
          );
          chapter.lectures.forEach((lectureTitle, lectureIndex) => {
            const lectureId = uuid();
            const video = videos[lectureCounter % videos.length];
            const uploadedAt = daysAgo(Math.max(1, (course.createdAtDaysAgo || 30) - Math.floor((subjectIndex * 4 + chapterIndex * 2 + lectureIndex) * 1.6)));
            const isPreview = lectureCounter === 0 || (subjectIndex === 0 && chapterIndex === 0 && lectureIndex === 0);
            run(
              `INSERT INTO lectures (id, course_id, chapter_id, title, description, video_key, duration_seconds, position, is_preview, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              lectureId, id, chapterId, lectureTitle,
              `${lectureTitle} — a ${Math.round(video.duration / 60)}-minute lesson from ${course.title} with worked examples and a checkpoint task.`,
              video.key, video.duration, lectureCounter, isPreview ? 1 : 0, uploadedAt, uploadedAt,
            );
            state.courseLectures.get(id).push({ id: lectureId, duration: video.duration });
            lectureCounter += 1;
          });
        });
      });
    });

    testDefs.forEach((definition) => {
      const id = uuid();
      const course = state.courses.get(definition.courseSlug);
      const teacherId = course ? course.teacherId : adminId;
      const createdAt = daysAgo(definition.createdDaysAgo || 15);
      const questions = [];
      const bankOffsets = {};
      for (const [bankKey, count] of Object.entries(definition.mix)) {
        const bank = questionBanks[bankKey];
        const offset = (definition.offset || 0) + (bankOffsets[bankKey] || 0);
        for (let i = 0; i < count; i += 1) {
          questions.push(bank[(offset + i) % bank.length]);
        }
      }
      run(
        `INSERT INTO tests (id, title, description, exam, type, course_id, duration_minutes, total_marks, negative_marking,
          status, instructions, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?, ?, ?, ?)`,
        id, definition.title, definition.description, definition.exam, definition.type, course?.id || null,
        definition.durationMinutes, questions.length * definition.marks, definition.negative,
        JSON.stringify(definition.instructions), teacherId, createdAt, createdAt,
      );
      state.tests.set(definition.slug, {
        id, title: definition.title, exam: definition.exam, duration: definition.durationMinutes,
        courseId: course?.id || null, teacherId, marks: definition.marks, negative: definition.negative,
        questionCount: questions.length,
      });
      questions.forEach((question, position) => {
        const options = question.type === 'mcq'
          ? question.options.map((text, index) => ({ id: ['a', 'b', 'c', 'd'][index], text }))
          : [];
        run(
          `INSERT INTO questions (id, test_id, subject, chapter, type, text, options, correct_answer, tolerance,
            marks, negative_marks, explanation, position)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          uuid(), id, question.subject, question.chapter, question.type, question.text, JSON.stringify(options),
          question.answer, question.tolerance || 0, definition.marks, definition.negative, question.explanation, position,
        );
      });
    });

    materials.forEach((material, index) => {
      const id = uuid();
      const course = state.courses.get(material.courseSlug);
      run(
        `INSERT INTO study_materials (id, title, description, exam, category, subject, chapter_name, file_key, is_premium,
          course_id, download_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, material.title, material.description, material.exam, material.category, material.subject,
        material.chapterName, materialPdfs[index], material.isPremium ? 1 : 0, course?.id || null,
        material.isPremium ? 6 + (index % 9) * 4 : 12 + (index % 7) * 6,
        daysAgo(5 + ((index * 3) % 50)),
      );
      state.materials.push({ id, material });
    });

    const ensureEnrollment = (userId, course, enrolledDaysAgo, status = 'active') => {
      const key = `${userId}:${course.id}`;
      if (state.enrollmentSet.has(key)) return;
      state.enrollmentSet.add(key);
      const enrolledAt = daysAgo(Math.max(1, enrolledDaysAgo));
      run(
        `INSERT INTO enrollments (id, user_id, course_id, status, enrolled_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)`,
        uuid(), userId, course.id, status, enrolledAt, iso(new Date(enrolledAt).getTime() + 365 * DAY),
      );
    };

    const demoEnrollments = [
      'jee-main-physics-2027', 'jee-main-mock-test-series', 'neet-biology-ncert-decoded', 'neet-chemistry-organic-inorganic',
      'ssc-cgl-complete', 'ssc-cgl-mock-series', 'upsc-prelims-gs-foundation', 'gate-cs-algorithms',
      'cuet-ug-mathematics', 'class10-science-free', 'jee-chemistry-foundations-free',
    ];
    demoEnrollments.forEach((slug, index) => {
      ensureEnrollment(demoStudentId, state.courses.get(slug), 36 - index);
    });

    studentIds.slice(1).forEach((studentId, index) => {
      const count = 2 + (index % 3);
      for (let k = 0; k < count; k += 1) {
        const slug = courses[(index * 7 + k * 5) % courses.length].slug;
        ensureEnrollment(studentId, state.courses.get(slug), 50 - ((index * 5 + k * 3) % 40));
      }
    });

    reviewSeeds.forEach((review, index) => {
      const course = state.courses.get(review.courseSlug);
      if (!course) return;
      const enrolled = all(
        'SELECT user_id FROM enrollments WHERE course_id = ? ORDER BY enrolled_at LIMIT 12',
        course.id,
      );
      if (!enrolled.length) return;
      const userId = enrolled[index % enrolled.length].user_id;
      const existing = get('SELECT id FROM reviews WHERE course_id = ? AND user_id = ?', course.id, userId);
      if (existing) return;
      run(
        `INSERT INTO reviews (id, course_id, user_id, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        uuid(), course.id, userId, review.rating, review.body, daysAgo(4 + ((index * 7) % 40)),
      );
    });

    function seedAttempt(userId, testKey, { days, correctShare, wrongShare, timeFraction, seed }) {
      const test = state.tests.get(testKey);
      if (!test) return null;
      if (test.courseId) {
        ensureEnrollment(userId, { id: test.courseId }, days + 12);
      }
      const questions = all('SELECT * FROM questions WHERE test_id = ? ORDER BY position', test.id);
      if (!questions.length) return null;
      const timeTaken = Math.max(120, Math.round(test.duration * 60 * timeFraction));
      const submittedMs = now - Math.round(days * DAY);
      const startedMs = submittedMs - timeTaken * 1000;
      const attemptId = uuid();
      let score = 0;
      let correctCount = 0;
      let incorrectCount = 0;
      let unattemptedCount = 0;
      const subjectStats = new Map();
      const chapterStats = new Map();
      const answers = [];

      const bucket = (map, key) => {
        if (!map.has(key)) map.set(key, { key, total: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0, maxMarks: 0 });
        return map.get(key);
      };

      questions.forEach((question, index) => {
        const subject = bucket(subjectStats, question.subject);
        const chapter = bucket(chapterStats, question.chapter || 'General');
        subject.total += 1;
        chapter.total += 1;
        subject.maxMarks += question.marks;
        chapter.maxMarks += question.marks;
        const roll = hashRatio(index, seed);
        let selectedOption = null;
        let numericAnswer = null;
        let outcome = 'unattempted';
        if (roll < correctShare) outcome = 'correct';
        else if (roll < correctShare + wrongShare) outcome = 'incorrect';

        if (outcome !== 'unattempted') {
          if (question.type === 'mcq') {
            const options = JSON.parse(question.options);
            if (outcome === 'correct') {
              selectedOption = question.correct_answer;
            } else {
              const wrong = options.find((option) => option.id !== question.correct_answer);
              selectedOption = wrong ? wrong.id : question.correct_answer;
            }
          } else {
            const expected = Number(question.correct_answer);
            numericAnswer = outcome === 'correct' ? expected : expected + (question.tolerance || 0) + 4;
          }
        }

        if (outcome === 'correct') {
          correctCount += 1;
          score += question.marks;
          subject.correct += 1;
          chapter.correct += 1;
          subject.score += question.marks;
          chapter.score += question.marks;
        } else if (outcome === 'incorrect') {
          incorrectCount += 1;
          score -= question.negative_marks || 0;
          subject.incorrect += 1;
          chapter.incorrect += 1;
          subject.score -= question.negative_marks || 0;
          chapter.score -= question.negative_marks || 0;
        } else {
          unattemptedCount += 1;
          subject.unattempted += 1;
          chapter.unattempted += 1;
        }

        answers.push({
          questionId: question.id,
          selectedOption,
          numericAnswer: numericAnswer === null ? null : String(numericAnswer),
          marked: outcome === 'unattempted' && index % 7 === 0 ? 1 : 0,
          visited: outcome !== 'unattempted' ? 1 : 0,
          seconds: Math.round(timeTaken / questions.length),
        });
      });

      score = Math.round(score * 100) / 100;
      const maxMarks = questions.reduce((sum, question) => sum + question.marks, 0);
      const accuracy = correctCount + incorrectCount > 0
        ? Math.round((correctCount / (correctCount + incorrectCount)) * 1000) / 10
        : 0;

      run(
        `INSERT INTO test_attempts (id, test_id, user_id, status, started_at, expires_at, submitted_at, score,
          correct_count, incorrect_count, unattempted_count, time_taken_seconds)
         VALUES (?, ?, ?, 'submitted', ?, ?, ?, ?, ?, ?, ?, ?)`,
        attemptId, test.id, userId, iso(startedMs), iso(startedMs + test.duration * 60 * 1000),
        iso(submittedMs), score, correctCount, incorrectCount, unattemptedCount, timeTaken,
      );
      for (const answer of answers) {
        run(
          `INSERT INTO attempt_answers (attempt_id, question_id, selected_option, numeric_answer, marked_for_review, visited, time_spent_seconds, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          attemptId, answer.questionId, answer.selectedOption, answer.numericAnswer, answer.marked, answer.visited,
          answer.seconds, iso(submittedMs),
        );
      }
      const resultId = uuid();
      run(
        `INSERT INTO results (id, attempt_id, test_id, user_id, score, max_marks, accuracy, rank, percentile,
          subject_breakdown, chapter_breakdown, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
        resultId, attemptId, test.id, userId, score, maxMarks, accuracy,
        JSON.stringify([...subjectStats.values()].map(({ key, ...rest }) => ({ subject: key, ...rest }))),
        JSON.stringify([...chapterStats.values()].map(({ key, ...rest }) => ({ chapter: key, ...rest }))),
        iso(submittedMs),
      );
      return { resultId, testId: test.id, score, maxMarks };
    }

    const demoAttempts = [
      { testKey: 'jee-main-full-mock-1', days: 27, correctShare: 0.76, wrongShare: 0.1, timeFraction: 0.86, seed: 3 },
      { testKey: 'jee-main-full-mock-2', days: 20, correctShare: 0.68, wrongShare: 0.05, timeFraction: 0.79, seed: 7 },
      { testKey: 'neet-full-mock-1', days: 14, correctShare: 0.78, wrongShare: 0.12, timeFraction: 0.82, seed: 5 },
      { testKey: 'neet-biology-cell-quiz', days: 13, correctShare: 0.84, wrongShare: 0.16, timeFraction: 0.51, seed: 9 },
      { testKey: 'ssc-cgl-tier1-mock-1', days: 10, correctShare: 0.75, wrongShare: 0.12, timeFraction: 0.72, seed: 4 },
      { testKey: 'gate-algorithms-quiz', days: 7, correctShare: 0.72, wrongShare: 0.18, timeFraction: 0.81, seed: 6 },
      { testKey: 'upsc-prelims-gs-mock-1', days: 4, correctShare: 0.6, wrongShare: 0.25, timeFraction: 0.74, seed: 2 },
    ];
    for (const attempt of demoAttempts) {
      const result = seedAttempt(demoStudentId, attempt.testKey, attempt);
      if (result) state.demoResults.push(result);
    }

    const testKeys = [...state.tests.keys()];
    studentIds.slice(1).forEach((studentId, index) => {
      const attemptsCount = 2 + (index % 2);
      for (let k = 0; k < attemptsCount; k += 1) {
        const testKey = testKeys[(index * 3 + k * 5) % testKeys.length];
        seedAttempt(studentId, testKey, {
          days: 2 + ((index * 4 + k * 9) % 33),
          correctShare: 0.32 + ((index + k) % 5) * 0.1,
          wrongShare: 0.1 + ((index + k) % 3) * 0.06,
          timeFraction: 0.55 + ((index * 7 + k) % 35) / 100,
          seed: index * 5 + k + 1,
        });
      }
    });

    const rankedTests = all('SELECT DISTINCT test_id FROM results').map((row) => row.test_id);
    for (const testId of rankedTests) {
      const rows = all(
        `SELECT r.id, r.score, a.time_taken_seconds FROM results r
         JOIN test_attempts a ON a.id = r.attempt_id
         WHERE r.test_id = ? ORDER BY r.score DESC, a.time_taken_seconds ASC`,
        testId,
      );
      rows.forEach((row, index) => {
        const rank = index + 1;
        const percentile = rows.length > 1 ? Math.round(((rows.length - 1 - index) / (rows.length - 1)) * 1000) / 10 : null;
        run('UPDATE results SET rank = ?, percentile = ? WHERE id = ?', rank, percentile, row.id);
      });
    }

    const progressPlan = {
      'jee-main-physics-2027': { complete: 5, partial: 1 },
      'jee-main-mock-test-series': { complete: 1, partial: 0 },
      'neet-biology-ncert-decoded': { complete: 4, partial: 1 },
      'neet-chemistry-organic-inorganic': { complete: 3, partial: 0 },
      'ssc-cgl-complete': { complete: 4, partial: 0 },
      'ssc-cgl-mock-series': { complete: 2, partial: 0 },
      'upsc-prelims-gs-foundation': { complete: 5, partial: 1 },
      'gate-cs-algorithms': { complete: 5, partial: 0 },
      'cuet-ug-mathematics': { complete: 3, partial: 0 },
      'class10-science-free': { complete: 4, partial: 0 },
      'jee-chemistry-foundations-free': { complete: 3, partial: 0 },
    };
    for (const [slug, plan] of Object.entries(progressPlan)) {
      const course = state.courses.get(slug);
      const lectures = state.courseLectures.get(course.id) || [];
      lectures.slice(0, plan.complete + (plan.partial ? 1 : 0)).forEach((lecture, index) => {
        const completed = index < plan.complete;
        const position = completed ? Math.round(lecture.duration * 0.96) : Math.round(lecture.duration * 0.34);
        run(
          `INSERT INTO lecture_progress (id, user_id, lecture_id, position_seconds, duration_seconds, completed, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          uuid(), demoStudentId, lecture.id, position, lecture.duration, completed ? 1 : 0,
          daysAgo(1 + index * 0.4),
        );
      });
    }

    const liveCourseSlugs = [
      { slug: 'jee-main-physics-2027', title: 'Rotational Motion: Problem Marathon', minutesFromNow: -15, duration: 60, mode: 'live' },
      { slug: 'jee-main-physics-2027', title: 'Work–Energy Theorem: Doubt Session', minutesFromNow: 60 * 22, duration: 90, mode: 'upcoming' },
      { slug: 'jee-advanced-mathematics', title: 'Definite Integrals: Advanced Problems', minutesFromNow: 60 * 30, duration: 90, mode: 'upcoming' },
      { slug: 'neet-biology-ncert-decoded', title: 'Human Physiology Revision', minutesFromNow: 60 * 50, duration: 90, mode: 'upcoming' },
      { slug: 'neet-biology-ncert-decoded', title: 'Genetics Problem Solving', minutesFromNow: -60 * 24 * 6, duration: 90, mode: 'completed' },
      { slug: 'neet-chemistry-organic-inorganic', title: 'Organic Mechanisms Clinic', minutesFromNow: 60 * 74, duration: 75, mode: 'upcoming' },
      { slug: 'ssc-cgl-complete', title: 'Quant Speed Test Discussion', minutesFromNow: 60 * 26, duration: 60, mode: 'upcoming' },
      { slug: 'gate-cs-algorithms', title: 'Dynamic Programming Masterclass', minutesFromNow: 60 * 98, duration: 90, mode: 'upcoming' },
      { slug: 'upsc-prelims-gs-foundation', title: 'Polity: Amendment Cases', minutesFromNow: -60 * 24 * 9, duration: 90, mode: 'completed' },
      { slug: 'jee-main-mock-test-series', title: 'Mock 1 Analysis and Strategy', minutesFromNow: -60 * 24 * 3, duration: 60, mode: 'completed' },
      { slug: 'cuet-ug-mathematics', title: 'Probability: Sectional Practice', minutesFromNow: 60 * 120, duration: 60, mode: 'upcoming' },
    ];
    const liveIds = [];
    for (const live of liveCourseSlugs) {
      const course = state.courses.get(live.slug);
      const startMs = now + live.minutesFromNow * 60 * 1000;
      const id = uuid();
      const status = live.mode === 'completed' ? 'completed' : 'scheduled';
      run(
        `INSERT INTO live_classes (id, course_id, teacher_id, title, description, scheduled_start, scheduled_end, room_name,
          join_url, status, recording_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, NULL, ?)`,
        id, course.id, course.teacherId, live.title,
        `${live.title} — live session for ${course.title}.`, iso(startMs), iso(startMs + live.duration * 60 * 1000),
        `edupulse-${live.slug}-${Math.abs(startMs) % 100000}`, status, daysAgo(4),
      );
      liveIds.push({ id, mode: live.mode, startMs });
    }
    for (const live of liveIds.filter((item) => item.mode !== 'upcoming')) {
      const attendees = [demoStudentId, ...studentIds.slice(1, 6)];
      for (const userId of attendees) {
        run(
          `INSERT INTO attendance (id, live_class_id, user_id, joined_at, left_at, status) VALUES (?, ?, ?, ?, ?, 'present')`,
          uuid(), live.id, userId, iso(live.startMs + 4 * 60 * 1000),
          live.mode === 'completed' ? iso(live.startMs + 70 * 60 * 1000) : null,
        );
      }
    }

    const addNotification = (userId, type, title, body, link, createdDaysAgo, read = false) => {
      run(
        `INSERT INTO notifications (id, user_id, type, title, body, link, read_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        uuid(), userId, type, title, body, link, read ? daysAgo(createdDaysAgo) : null, daysAgo(createdDaysAgo),
      );
    };

    addNotification(demoStudentId, 'welcome', 'Welcome to EduPulse', 'Your learning dashboard is ready. Start with a lecture or attempt a practice test.', '/dashboard', 40, true);
    addNotification(demoStudentId, 'enrollment', 'Enrollment confirmed', 'You now have access to JEE Main 2027 Physics: Complete Course.', '/courses/jee-main-physics-2027', 30, true);
    addNotification(demoStudentId, 'lecture', 'New lecture uploaded', '“Rolling Without Slipping Problems” has been added to your Physics course.', '/courses/jee-main-physics-2027', 4);
    addNotification(demoStudentId, 'live_class', 'Live class starting soon', 'Rotational Motion: Problem Marathon is live now.', '/live-classes', 0.2);
    addNotification(demoStudentId, 'material', 'New study material', 'JEE Physics Formula Sheet: Mechanics to Modern Physics is available.', '/materials', 6, true);
    addNotification(demoStudentId, 'test', 'Mock test available', 'JEE Main 2027 Full Mock 2 is open for attempt.', '/tests', 9, true);
    for (const result of state.demoResults) {
      addNotification(
        demoStudentId, 'test_result', 'Result published',
        `You scored ${result.score} / ${result.maxMarks}. Open the analysis to review solutions.`,
        `/dashboard/results/${result.resultId}`, Math.max(1, Math.round((now - new Date(all('SELECT created_at FROM results WHERE id = ?', result.resultId)[0].created_at).getTime()) / DAY)),
      );
    }

    const vikramId = state.users.get('teacher@edupulse.demo');
    addNotification(vikramId, 'enrollment', 'New student enrolled', 'A student joined JEE Main 2027 Physics: Complete Course.', '/teacher/courses', 2);
    addNotification(vikramId, 'review', 'New 5-star review', '“Dr. Sethi changed how I approach physics problems…”', '/teacher/courses', 5);
    addNotification(vikramId, 'live_class', 'Your class is live', 'Rotational Motion: Problem Marathon is live now.', '/teacher/live', 0.2);
    addNotification(vikramId, 'student', 'Student completed a lecture', 'A student completed “Moment of Inertia: Standard Cases”.', '/teacher/students', 1);
    addNotification(vikramId, 'course', 'Draft course reminder', 'Wave Optics Deep Dive is still in draft. Add lectures and submit for review.', '/teacher/courses', 3);

    addNotification(adminId, 'teacher_application', 'New educator application', 'Karan Bhatt applied to teach Physics. Review the application.', '/admin/teachers', 3);
    addNotification(adminId, 'contact', 'New contact message', 'A parent asked about the Class 10 Science course.', '/admin/messages', 2);
    addNotification(adminId, 'course', 'Course published', 'Class 12 CBSE Physics Board Booster is now live.', '/admin/courses', 7, true);
    addNotification(adminId, 'system', 'Weekly platform summary', 'New enrollments and test attempts were recorded this week. Open analytics for details.', '/admin', 1);

    const demoLectures = state.courseLectures.get(state.courses.get('jee-main-physics-2027').id) || [];
    const demoMaterial = state.materials[0];
    const demoTest = state.tests.get('jee-main-full-mock-1');
    run(
      `INSERT INTO bookmarks (id, user_id, entity_type, entity_id, created_at) VALUES (?, ?, 'lecture', ?, ?)`,
      uuid(), demoStudentId, demoLectures[2]?.id || demoLectures[0].id, daysAgo(3),
    );
    run(
      `INSERT INTO bookmarks (id, user_id, entity_type, entity_id, created_at) VALUES (?, ?, 'material', ?, ?)`,
      uuid(), demoStudentId, demoMaterial.id, daysAgo(5),
    );
    run(
      `INSERT INTO bookmarks (id, user_id, entity_type, entity_id, created_at) VALUES (?, ?, 'test', ?, ?)`,
      uuid(), demoStudentId, demoTest.id, daysAgo(2),
    );
    run(
      `INSERT INTO bookmarks (id, user_id, entity_type, entity_id, created_at) VALUES (?, ?, 'course', ?, ?)`,
      uuid(), demoStudentId, state.courses.get('jee-main-physics-2027').id, daysAgo(8),
    );

    state.materials.slice(0, 6).forEach(({ id }, index) => {
      run(
        'INSERT INTO material_views (id, user_id, material_id, viewed_at) VALUES (?, ?, ?, ?)',
        uuid(), demoStudentId, id, daysAgo(2 + index),
      );
    });

    faqs.forEach((faq, index) => {
      run('INSERT INTO faqs (id, question, answer, category, position) VALUES (?, ?, ?, ?, ?)', uuid(), faq.question, faq.answer, 'General', index);
    });
    banners.forEach((banner) => {
      run(
        `INSERT INTO banners (id, title, subtitle, cta_label, cta_link, theme, active, position) VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
        uuid(), banner.title, banner.subtitle, banner.ctaLabel, banner.ctaLink, banner.theme, banner.position,
      );
    });
    run('INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)', uuid(), 'parent.demo@example.com', daysAgo(12));
    run('INSERT INTO newsletter_subscribers (id, email, created_at) VALUES (?, ?, ?)', uuid(), 'learner.demo@example.com', daysAgo(6));
    run(
      `INSERT INTO contact_messages (id, name, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, 'new', ?)`,
      uuid(), 'Rekha Sharma', 'rekha.parent@example.com', 'Class 10 Science course',
      'My daughter is in Class 10. Is the free science course aligned with the CBSE syllabus?', daysAgo(2),
    );
    run(
      `INSERT INTO contact_messages (id, name, email, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, 'read', ?)`,
      uuid(), 'Karan Bhatt', 'karan.bhatt@edupulse.demo', 'Educator application',
      'I have applied as a Physics educator. Could you share the review timeline?', daysAgo(3),
    );

    console.log('[seed] Seeded:');
    console.log(`  users: ${all('SELECT COUNT(*) AS c FROM users')[0].c} (1 admin, 13 teachers, ${studentIds.length} students)`);
    console.log(`  categories: ${all('SELECT COUNT(*) AS c FROM categories')[0].c}`);
    console.log(`  courses: ${all('SELECT COUNT(*) AS c FROM courses')[0].c} (${all("SELECT COUNT(*) AS c FROM courses WHERE status = 'published'")[0].c} published)`);
    console.log(`  lectures: ${all('SELECT COUNT(*) AS c FROM lectures')[0].c}`);
    console.log(`  tests: ${all('SELECT COUNT(*) AS c FROM tests')[0].c}, questions: ${all('SELECT COUNT(*) AS c FROM questions')[0].c}`);
    console.log(`  materials: ${all('SELECT COUNT(*) AS c FROM study_materials')[0].c}`);
    console.log(`  enrollments: ${all('SELECT COUNT(*) AS c FROM enrollments')[0].c}`);
    console.log(`  attempts: ${all('SELECT COUNT(*) AS c FROM test_attempts')[0].c}, results: ${all('SELECT COUNT(*) AS c FROM results')[0].c}`);
    console.log(`  live classes: ${all('SELECT COUNT(*) AS c FROM live_classes')[0].c}, reviews: ${all('SELECT COUNT(*) AS c FROM reviews')[0].c}`);
    console.log('[seed] Demo accounts (development only):');
    console.log('  student@edupulse.demo / Student@123');
    console.log('  teacher@edupulse.demo / Teacher@123');
    console.log('  admin@edupulse.demo / Admin@123');
  });
}

main()
  .then(() => {
    console.log('[seed] Done.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exit(1);
  });
