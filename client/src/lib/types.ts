export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  avatarColor: string;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  notificationPrefs: { inApp: boolean; email: boolean; push: boolean };
  createdAt: string;
  profile?: {
    targetExam: string | null;
    classLevel: string | null;
    preferredLanguage: string | null;
    dob: string | null;
    learningGoal: string | null;
    streakDays: number;
    headline: string | null;
    qualification: string | null;
    experienceYears: number | null;
    subjects: string | null;
    bio: string | null;
    approved: boolean | null;
  };
}

export interface TeacherRef {
  id: string;
  name: string;
  avatarColor: string;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  category: string;
  exam: string;
  classLevel: string | null;
  subjectArea: string | null;
  language: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  priceCents: number;
  mrpCents: number;
  discountPercent: number;
  isFree: boolean;
  theme: string;
  status: 'draft' | 'published' | 'archived';
  teacher: TeacherRef;
  rating: { average: number | null; count: number };
  enrolledCount: number;
  lectureCount: number;
  totalDurationSeconds: number;
  learningObjectives: string[];
  targetAudience: string | null;
  startDate: string | null;
  endDate: string | null;
  validityDays: number;
  batchTimings: string | null;
  createdAt: string;
  updatedAt: string;
  enrolled?: boolean;
}

export interface Lecture {
  id: string;
  courseId: string;
  chapterId: string | null;
  title: string;
  description: string | null;
  durationSeconds: number;
  position: number;
  isPreview: boolean;
  hasVideo: boolean;
  completed: boolean;
  progressSeconds: number;
  createdAt: string;
  locked?: boolean;
}

export interface CurriculumSubject {
  id: string;
  name: string;
  chapters: { id: string; name: string; lectures: Lecture[] }[];
}

export interface Material {
  id: string;
  title: string;
  description: string | null;
  exam: string;
  category: string;
  subject: string | null;
  chapterName: string | null;
  isPremium: boolean;
  courseId: string | null;
  courseTitle: string | null;
  downloadCount: number;
  createdAt: string;
  canDownload?: boolean;
  bookmarked?: boolean;
}

export interface MaterialDetail {
  material: Material;
  related: Material[];
}

export interface Test {
  id: string;
  title: string;
  description: string | null;
  exam: string;
  type: string;
  courseId: string | null;
  courseTitle: string | null;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  status: string;
  instructions: string[];
  questionCount: number;
  attemptCount: number;
  startAt: string | null;
  endAt: string | null;
  createdAt: string;
  createdBy?: string;
  requiresEnrollment?: boolean;
  canAttempt?: boolean;
  latestAttempt?: { id: string; status: string } | null;
}

export interface LiveClass {
  id: string;
  courseId: string | null;
  courseTitle: string | null;
  teacher: TeacherRef;
  title: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  hasJoinLink: boolean;
  recordingUrl: string | null;
  attendeeCount: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  body: string | null;
  createdAt: string;
  studentName: string;
  avatarColor: string;
}

export interface ReviewSummary {
  average: number | null;
  total: number;
  distribution: { rating: number; count: number }[];
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string | null;
  description?: string | null;
  icon: string;
  accent: string;
  courseCount: number;
  fromPriceCents: number | null;
}

export interface HomeContent {
  stats: {
    students: number;
    courses: number;
    lectures: number;
    tests: number;
    questions: number;
    avgRating: number | null;
    reviews: number;
    materials: number;
  };
  banners: { id: string; title: string; subtitle: string | null; ctaLabel: string | null; ctaLink: string | null; theme: string | null }[];
  categories: Category[];
  popular: Course[];
  bestsellers: Course[];
  upcomingLive: LiveClass[];
  freeResources: Material[];
  recentLectures: {
    id: string;
    title: string;
    durationSeconds: number;
    createdAt: string;
    isPreview: boolean;
    courseTitle: string;
    courseSlug: string;
    theme: string;
  }[];
  topEducators: {
    id: string;
    name: string;
    avatarColor: string;
    headline: string | null;
    qualification: string | null;
    experienceYears: number | null;
    subjects: string | null;
    courseCount: number;
    studentCount: number;
    ratingAvg: number | null;
  }[];
  achievements: {
    studentName: string;
    avatarColor: string;
    testTitle: string;
    exam: string;
    score: number;
    maxMarks: number;
    percent: number;
    rank: number | null;
    percentile: number | null;
    date: string;
  }[];
  successStories: {
    studentName: string;
    avatarColor: string;
    courseTitle: string;
    exam: string;
    rating: number;
    body: string;
    date: string;
  }[];
  testimonials: {
    studentName: string;
    avatarColor: string;
    courseTitle: string;
    exam: string;
    rating: number;
    body: string;
  }[];
  faqs: { id: string; question: string; answer: string; category: string | null }[];
  integrations: Record<string, unknown> & { paymentNote: string };
}

export interface CourseDetail {
  course: Course;
  teacher: {
    id: string;
    name: string;
    avatarColor: string;
    headline: string | null;
    qualification: string | null;
    experienceYears: number | null;
    subjects: string | null;
    bio: string | null;
    courseCount: number;
    studentCount: number;
  };
  access: {
    hasAccess: boolean;
    isOwner: boolean;
    enrolledAt: string | null;
    expiresAt: string | null;
    requiresPurchase: boolean;
  };
  curriculum: CurriculumSubject[];
  tests: {
    id: string;
    title: string;
    type: string;
    durationMinutes: number;
    totalMarks: number;
    questionCount: number;
    attemptCount: number;
  }[];
  upcomingLive: LiveClass[];
  reviews: { summary: ReviewSummary; items: Review[] };
  related: Course[];
  totals: { lectures: number; previewLectures: number; durationSeconds: number };
}

export interface EnrollmentSummary {
  enrollmentId: string;
  enrolledAt: string;
  expiresAt: string | null;
  course: {
    id: string;
    slug: string;
    title: string;
    exam: string;
    category: string;
    theme: string;
    language: string;
    level: string;
    teacherName: string;
    teacherAvatarColor: string;
  };
  lectureCount: number;
  completedCount: number;
  progressPercent: number;
  nextLiveAt: string | null;
}

export interface StudentDashboard {
  enrollments: EnrollmentSummary[];
  stats: {
    activeCourses: number;
    lecturesCompleted: number;
    watchSeconds: number;
    testsTaken: number;
    avgAccuracy: number | null;
    attendancePercent: number | null;
    streakDays: number;
  };
  upcomingLive: LiveClass[];
  availableTests: Test[];
  recentResults: {
    id: string;
    score: number;
    maxMarks: number;
    accuracy: number;
    rank: number | null;
    percentile: number | null;
    createdAt: string;
    testTitle: string;
    exam: string;
  }[];
}

export interface Performance {
  results: {
    id: string;
    testTitle: string;
    exam: string;
    score: number;
    maxMarks: number;
    percent: number;
    accuracy: number;
    rank: number | null;
    percentile: number | null;
    createdAt: string;
  }[];
  subjects: {
    subject: string;
    correct: number;
    incorrect: number;
    unattempted: number;
    score: number;
    maxMarks: number;
    accuracy: number;
  }[];
  weakSubjects: { subject: string; accuracy: number }[];
  strongSubjects: { subject: string; accuracy: number }[];
  studyTimeSeconds: number;
  lecturesWatched: number;
  enrollments: {
    id: string;
    slug: string;
    title: string;
    theme: string | null;
    lectureCount: number;
    completedCount: number;
    progressPercent: number;
  }[];
}

export interface CalendarData {
  from: string;
  to: string;
  liveClasses: LiveClass[];
  tests: {
    id: string;
    title: string;
    exam: string;
    durationMinutes: number;
    totalMarks: number;
    scheduledAt: string;
  }[];
}

export interface MyCourse {
  course: {
    id: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string;
    exam: string;
    category: string;
    theme: string;
    teacher: TeacherRef;
    language: string;
    level: string;
    validityDays: number;
    batchTimings: string | null;
  };
  curriculum: CurriculumSubject[];
  progress: {
    totalLectures: number;
    completedLectures: number;
    percent: number;
    nextLectureId: string | null;
  };
  tests: Test[];
  live: LiveClass[];
  materials: { id: string; title: string; category: string; isPremium: boolean }[];
}

export interface LectureDetail {
  lecture: Lecture & {
    chapterName: string | null;
    subjectName: string | null;
    streamUrl: string;
    hasAccess: boolean;
  };
  course: { id: string; slug: string; title: string; theme: string; teacherName: string };
  teacher: { id: string; name: string; avatar_color?: string; avatarColor?: string; headline: string | null } | null;
  navigation: {
    previousId: string | null;
    nextId: string | null;
    current: number;
    total: number;
    completedPercent: number;
  };
  siblings: { id: string; title: string; duration: number; isPreview: boolean; completed: boolean }[];
  progress: { positionSeconds: number; completed: boolean };
  materials: { id: string; title: string; category: string; isPremium: boolean }[];
  bookmarked: boolean;
}

export interface AttemptState {
  attempt: {
    id: string;
    testId: string;
    status: 'in_progress' | 'submitted' | 'expired';
    startedAt: string;
    expiresAt: string;
    submittedAt: string | null;
  };
  test: {
    id: string;
    title: string;
    exam: string;
    durationMinutes: number;
    totalMarks: number;
    negativeMarking: number;
    instructions: string[];
  };
  questions: {
    id: string;
    subject: string;
    chapter: string | null;
    type: 'mcq' | 'numerical';
    text: string;
    options: { id: string; text: string }[];
    marks: number;
    negativeMarks: number;
    position: number;
  }[];
  answers: Record<
    string,
    {
      selectedOption: string | null;
      numericAnswer: string | null;
      markedForReview: boolean;
      visited: boolean;
      timeSpentSeconds: number;
    }
  >;
  serverNow: string;
  resumed?: boolean;
  expired?: boolean;
  autoSubmitted?: boolean;
}

export interface TestDetail {
  test: Test;
  distribution: { subject: string; count: number; marks: number }[];
  access: boolean;
  requiresEnrollment: boolean;
  courseSlug: string | null;
  attempts: {
    id: string;
    status: string;
    startedAt: string;
    submittedAt: string | null;
    score: number | null;
    maxMarks: number | null;
    accuracy: number | null;
    rank: number | null;
    percentile: number | null;
    resultId: string | null;
    timeTakenSeconds: number | null;
  }[];
  inProgressAttemptId: string | null;
  serverNow: string;
}

export interface SubjectBreakdown {
  subject: string;
  total: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maxMarks: number;
}

export interface ResultDetail {
  id: string;
  test: { id: string; title: string; exam: string; type: string; durationMinutes: number };
  student: { id: string; name: string };
  score: number;
  maxMarks: number;
  accuracy: number;
  rank: number | null;
  percentile: number | null;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  timeTakenSeconds: number;
  submittedAt: string;
  attemptStatus: string;
  subjectBreakdown: SubjectBreakdown[];
  chapterBreakdown: { chapter: string; total: number; correct: number; incorrect: number; unattempted: number; score: number; maxMarks: number }[];
  questions: {
    id: string;
    subject: string;
    chapter: string | null;
    type: 'mcq' | 'numerical';
    text: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    tolerance: number;
    explanation: string | null;
    marks: number;
    negativeMarks: number;
    selectedOption: string | null;
    numericAnswer: string | null;
    isAttempted: boolean;
    isCorrect: boolean;
    markedForReview: boolean;
  }[];
}

export interface MyAttempt {
  id: string;
  status: string;
  testTitle: string;
  exam: string;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  maxMarks: number;
  accuracy: number | null;
  rank: number | null;
  percentile: number | null;
  timeTakenSeconds: number | null;
  resultId: string | null;
}

export interface SearchResults {
  query: string;
  courses: Course[];
  educators: { id: string; name: string; avatarColor: string; headline: string | null; experienceYears: number | null; subjects: string | null; courseCount: number; studentCount: number }[];
  materials: Material[];
  tests: Test[];
  lectures: { id: string; title: string; durationSeconds: number; courseTitle: string; courseSlug: string; theme: string }[];
  totals: { courses: number; educators: number; materials: number; tests: number; lectures: number };
}

export interface TeacherOverview {
  stats: { students: number; publishedCourses: number; upcomingClasses: number; lectures: number; publishedTests: number; avgAccuracy: number | null };
  courses: {
    id: string;
    slug: string;
    title: string;
    exam: string;
    category: string;
    status: string;
    priceCents: number;
    theme: string;
    enrolledCount: number;
    lectureCount: number;
    ratingAvg: number | null;
    ratingCount: number;
    nextLiveAt: string | null;
    updatedAt: string;
    totalDurationSeconds: number;
  }[];
  students: { id: string; name: string; email: string; avatarColor: string; courseCount: number; testsTaken: number; avgAccuracy: number | null; lastActive: string | null }[];
  recentEnrollments: { enrolledAt: string; name: string; avatarColor: string; courseTitle: string; courseId: string }[];
  upcoming: LiveClass[];
}

export interface AdminOverview {
  counts: {
    students: number;
    teachers: number;
    total_users: number;
    published_courses: number;
    total_courses: number;
    enrollments: number;
    live_sessions: number;
    test_attempts: number;
    materials: number;
    new_messages: number;
    new_users_30d: number;
    paymentsConfigured: boolean;
    revenueCents: number | null;
  };
  popularCourses: {
    id: string;
    title: string;
    exam: string;
    category: string;
    thumbnail_theme: string | null;
    enrolled_count: number;
    rating_avg: number | null;
    teacher_name: string;
  }[];
  monthlyRegistrations: { month: string; count: number }[];
  monthlyEnrollments: { month: string; count: number }[];
  recentUsers: { id: string; name: string; email: string; role: string; avatar_color: string; created_at: string; status: string }[];
  integrations: Record<string, boolean>;
  system: {
    nodeVersion: string;
    uptimeSeconds: number;
    platform: string;
    memoryUsedMb: number;
    environment: string;
  };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: 'active' | 'suspended';
  avatarColor: string;
  createdAt: string;
  courseCount?: number;
  lastActive?: string | null;
}

export interface AdminCourseRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  priceCents: number;
  category: string;
  exam: string;
  enrolledCount: number;
  lectureCount: number;
  teacherName: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: 'new' | 'read' | 'resolved';
  createdAt: string;
}

export interface SessionRow {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  current?: boolean;
}

export interface BookmarkItem {
  id: string;
  entityType: 'lecture' | 'material' | 'test' | 'course';
  entityId: string;
  title: string;
  subtitle: string;
  link: string;
  createdAt: string;
}

export interface IntegrationStatus {
  integrations: { razorpay?: boolean; livekit?: boolean; llm?: boolean; smtp?: boolean; s3?: boolean; [k: string]: boolean | undefined };
  environment: string;
  notes: Record<string, string>;
}

export interface TeacherOverviewData {
  stats: {
    students: number;
    publishedCourses: number;
    upcomingClasses: number;
    lectures: number;
    publishedTests: number;
    avgAccuracy: number | null;
  };
  courses: {
    id: string;
    slug: string;
    title: string;
    exam: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    priceCents: number;
    theme: string;
    enrolledCount: number;
    lectureCount: number;
    ratingAvg: number | null;
    ratingCount: number;
    nextLiveAt: string | null;
    updatedAt: string;
    totalDurationSeconds: number;
  }[];
  students: TeacherStudentRow[];
  recentEnrollments: { enrolled_at: string; name: string; avatar_color: string; course_title: string; course_id: string }[];
  upcoming: LiveClass[];
}

export interface TeacherStudentRow {
  id: string;
  name: string;
  email: string;
  avatar_color: string;
  course_count: number;
  tests_taken: number;
  avg_accuracy: number | null;
  last_active: string | null;
}

export interface ManagedCourse {
  course: Course;
  curriculum: {
    id: string;
    name: string;
    chapters: {
      id: string;
      name: string;
      lectures: { id: string; title: string; description: string | null; durationSeconds: number; position: number; isPreview: boolean; hasVideo: boolean }[];
    }[];
    ungroupedLectures: { id: string; title: string; durationSeconds: number; isPreview: boolean; hasVideo: boolean }[];
  }[];
  tests: { id: string; title: string; type: string; status: string; durationMinutes: number; totalMarks: number; questionCount: number; attemptCount: number; createdAt: string }[];
  materials: { id: string; title: string; category: string; subject: string | null; isPremium: boolean; downloadCount: number; createdAt: string }[];
  liveClasses: { id: string; title: string; scheduledStart: string; scheduledEnd: string; status: string }[];
  students: {
    id: string; name: string; email: string; avatar_color: string; enrolled_at: string;
    completed_lectures: number; total_lectures: number; avg_accuracy: number | null; progressPercent: number;
  }[];
  stats: { enrollments: number; lectures: number; tests: number; materials: number };
}

export interface ManagedTest {
  test: {
    id: string;
    title: string;
    description: string | null;
    exam: string;
    type: string;
    courseId: string | null;
    durationMinutes: number;
    totalMarks: number;
    negativeMarking: number;
    status: 'draft' | 'published' | 'archived';
    instructions: string[];
    startAt: string | null;
    endAt: string | null;
  };
  questions: {
    id: string;
    subject: string;
    chapter: string | null;
    type: 'mcq' | 'numerical';
    text: string;
    options: { id: string; text: string }[];
    correctAnswer: string;
    tolerance: number;
    marks: number;
    negativeMarks: number;
    explanation: string | null;
    position: number;
  }[];
}

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  status: 'active' | 'suspended';
  avatarColor: string;
  createdAt: string;
  targetExam: string | null;
  classLevel: string | null;
  teacherApproved: boolean | null;
  headline: string | null;
  enrollmentCount: number;
  courseCount: number;
}

export interface AdminOverviewData {
  counts: {
    students: number;
    teachers: number;
    total_users: number;
    published_courses: number;
    total_courses: number;
    enrollments: number;
    live_sessions: number;
    test_attempts: number;
    materials: number;
    new_messages: number;
    new_users_30d: number;
    paymentsConfigured: boolean;
    revenueCents: number | null;
  };
  popularCourses: { id: string; title: string; exam: string; category: string; thumbnail_theme: string | null; enrolled_count: number; rating_avg: number | null; teacher_name: string }[];
  monthlyRegistrations: { month: string; count: number }[];
  monthlyEnrollments: { month: string; count: number }[];
  recentUsers: { id: string; name: string; email: string; role: Role; avatar_color: string; created_at: string; status: string }[];
  integrations: Record<string, boolean>;
  system: { nodeVersion: string; uptimeSeconds: number; platform: string; memoryUsedMb: number; environment: string };
}

export interface AdminHealth {
  status: string;
  environment: string;
  nodeVersion: string;
  uptimeSeconds: number;
  memoryUsedMb: number;
  dbSizeMb: number;
  counts: { users: number; courses: number; live_classes: number; attempts: number };
  integrations: Record<string, boolean>;
  emailConfigured: boolean;
  storage: string;
}

export interface PendingTeacher {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_color: string;
  created_at: string;
  headline: string | null;
  qualification: string | null;
  subjects: string | null;
}
