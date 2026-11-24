import { parseJson } from '../utils/misc.js';

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || null,
    role: row.role,
    avatarColor: row.avatar_color || '#F97316',
    status: row.status,
    emailVerified: Boolean(row.email_verified),
    notificationPrefs: parseJson(row.notification_prefs, {}),
    createdAt: row.created_at,
  };
}

export function teacherSummary(row) {
  if (!row) return null;
  return {
    id: row.id || row.teacher_id,
    name: row.name || row.teacher_name,
    headline: row.headline || null,
    qualification: row.qualification || null,
    experienceYears: row.experience_years ?? null,
    subjects: row.subjects || null,
    bio: row.bio || null,
    avatarColor: row.avatar_color || row.teacher_avatar_color || '#F97316',
    courseCount: row.course_count ?? undefined,
    studentCount: row.student_count ?? undefined,
    ratingAvg: row.rating_avg ?? undefined,
  };
}

export function mapCourse(row) {
  if (!row) return null;
  const priceCents = row.price_cents ?? 0;
  const mrpCents = row.mrp_cents ?? 0;
  const discountPercent = mrpCents > priceCents ? Math.round(((mrpCents - priceCents) / mrpCents) * 100) : 0;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    category: row.category,
    exam: row.exam,
    classLevel: row.class_level,
    subjectArea: row.subject_area,
    language: row.language,
    level: row.level,
    durationWeeks: row.duration_weeks,
    priceCents,
    mrpCents,
    discountPercent,
    isFree: priceCents === 0,
    theme: row.thumbnail_theme || row.category,
    status: row.status,
    teacher: {
      id: row.teacher_id,
      name: row.teacher_name,
      avatarColor: row.teacher_avatar_color || '#F97316',
    },
    rating: {
      average: row.rating_avg ? Number(row.rating_avg) : null,
      count: row.rating_count ?? 0,
    },
    enrolledCount: row.enrolled_count ?? 0,
    lectureCount: row.lecture_count ?? 0,
    totalDurationSeconds: row.total_seconds ?? 0,
    learningObjectives: parseJson(row.learning_objectives, []),
    targetAudience: row.target_audience,
    startDate: row.start_date,
    endDate: row.end_date,
    validityDays: row.validity_days,
    batchTimings: row.batch_timings,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapLecture(row) {
  if (!row) return null;
  return {
    id: row.id,
    courseId: row.course_id,
    chapterId: row.chapter_id,
    title: row.title,
    description: row.description,
    durationSeconds: row.duration_seconds,
    position: row.position,
    isPreview: Boolean(row.is_preview),
    hasVideo: Boolean(row.video_key || row.external_video_url),
    completed: Boolean(row.completed),
    progressSeconds: row.position_seconds ?? 0,
    createdAt: row.created_at,
  };
}

export function mapMaterial(row, { includeFile = false } = {}) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    exam: row.exam,
    category: row.category,
    subject: row.subject,
    chapterName: row.chapter_name,
    isPremium: Boolean(row.is_premium),
    courseId: row.course_id,
    courseTitle: row.course_title || null,
    downloadCount: row.download_count ?? 0,
    createdAt: row.created_at,
    canDownload: includeFile ? Boolean(row.can_download) : undefined,
  };
}

export function mapTest(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    exam: row.exam,
    type: row.type,
    courseId: row.course_id,
    courseTitle: row.course_title || null,
    durationMinutes: row.duration_minutes,
    totalMarks: row.total_marks,
    negativeMarking: row.negative_marking,
    status: row.status,
    instructions: parseJson(row.instructions, []),
    questionCount: row.question_count ?? 0,
    attemptCount: row.attempt_count ?? 0,
    startAt: row.start_at,
    endAt: row.end_at,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export function mapLiveClass(row) {
  if (!row) return null;
  const start = new Date(row.scheduled_start).getTime();
  const end = new Date(row.scheduled_end).getTime();
  const now = Date.now();
  let state = row.status;
  if (row.status === 'scheduled' && now >= start && now <= end) state = 'live';
  else if (row.status === 'scheduled' && now > end) state = 'completed';
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: row.course_title || null,
    teacher: {
      id: row.teacher_id,
      name: row.teacher_name,
      avatarColor: row.teacher_avatar_color || '#F97316',
    },
    title: row.title,
    description: row.description,
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    status: state,
    hasJoinLink: Boolean(row.join_url),
    recordingUrl: row.recording_url,
    attendeeCount: row.attendee_count ?? 0,
  };
}

export function mapNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}
