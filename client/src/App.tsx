import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { HomePage } from './pages/Home';
import { CoursesPage } from './pages/Courses';
import { CourseDetailPage } from './pages/CourseDetail';
import { MaterialsPage } from './pages/Materials';
import { TestSeriesPage } from './pages/TestSeries';
import { TestDetailPage } from './pages/TestDetail';
import { LiveClassesPage } from './pages/LiveClasses';
import { ResultsPage } from './pages/Results';
import { AboutPage } from './pages/About';
import { ContactPage } from './pages/Contact';
import { SearchPage } from './pages/Search';
import { CheckoutPage } from './pages/Checkout';
import { NotFoundPage } from './pages/NotFound';
import { LoginPage } from './pages/auth/Login';
import { RegisterPage } from './pages/auth/Register';
import { ForgotPasswordPage } from './pages/auth/ForgotPassword';
import { ResetPasswordPage } from './pages/auth/ResetPassword';

import { StudentDashboardPage } from './pages/dashboard/StudentDashboard';
import { MyLearningPage } from './pages/dashboard/MyLearning';
import { LearningCoursePage } from './pages/dashboard/LearningCourse';
import { CalendarPage } from './pages/dashboard/Calendar';
import { MyTestsPage } from './pages/dashboard/MyTests';
import { ResultsListPage } from './pages/dashboard/ResultsList';
import { ResultDetailPage } from './pages/dashboard/ResultDetail';
import { PerformancePage } from './pages/dashboard/Performance';
import { BookmarksPage } from './pages/dashboard/Bookmarks';
import { NotificationsPage } from './pages/dashboard/Notifications';
import { ProfilePage } from './pages/dashboard/Profile';
import { SettingsPage } from './pages/dashboard/Settings';
import { AiTutorPage } from './pages/dashboard/AiTutor';
import { LecturePlayerPage } from './pages/player/LecturePlayer';
import { AttemptPage } from './pages/tests/Attempt';

import { TeacherOverviewPage } from './pages/teacher/TeacherOverview';
import { TeacherCoursesPage } from './pages/teacher/TeacherCourses';
import { TeacherCourseManagePage } from './pages/teacher/TeacherCourseManage';
import { TeacherTestsPage } from './pages/teacher/TeacherTests';
import { TeacherTestManagePage } from './pages/teacher/TeacherTestManage';
import { TeacherLiveClassesPage } from './pages/teacher/TeacherLiveClasses';
import { TeacherStudentsPage } from './pages/teacher/TeacherStudents';
import { TeacherMaterialsPage } from './pages/teacher/TeacherMaterials';

import { AdminOverviewPage } from './pages/admin/AdminOverview';
import { AdminUsersPage } from './pages/admin/AdminUsers';
import { AdminCoursesPage } from './pages/admin/AdminCourses';
import { AdminTeachersPage } from './pages/admin/AdminTeachers';
import { AdminMessagesPage } from './pages/admin/AdminMessages';
import { AdminSessionsPage } from './pages/admin/AdminSessions';
import { AdminIntegrationsPage } from './pages/admin/AdminIntegrations';

export function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/materials" element={<MaterialsPage />} />
        <Route path="/tests" element={<TestSeriesPage />} />
        <Route path="/tests/:id" element={<TestDetailPage />} />
        <Route path="/live-classes" element={<LiveClassesPage />} />
        <Route path="/results" element={<ResultsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/checkout/:slug"
          element={
            <ProtectedRoute roles={['student']}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:resultId"
          element={
            <ProtectedRoute roles={['student']}>
              <ResultDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/attempts/:attemptId"
        element={
          <ProtectedRoute roles={['student']}>
            <AttemptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/lectures/:lectureId"
        element={
          <ProtectedRoute roles={['student']}>
            <LecturePlayerPage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<ProtectedRoute roles={['student']}><StudentDashboardPage /></ProtectedRoute>} />
        <Route path="/dashboard/learning" element={<ProtectedRoute roles={['student']}><MyLearningPage /></ProtectedRoute>} />
        <Route path="/dashboard/learning/:courseId" element={<ProtectedRoute roles={['student']}><LearningCoursePage /></ProtectedRoute>} />
        <Route path="/dashboard/calendar" element={<ProtectedRoute roles={['student']}><CalendarPage /></ProtectedRoute>} />
        <Route path="/dashboard/tests" element={<ProtectedRoute roles={['student']}><MyTestsPage /></ProtectedRoute>} />
        <Route path="/dashboard/results" element={<ProtectedRoute roles={['student']}><ResultsListPage /></ProtectedRoute>} />
        <Route path="/dashboard/results/:resultId" element={<ProtectedRoute roles={['student']}><ResultDetailPage /></ProtectedRoute>} />
        <Route path="/dashboard/performance" element={<ProtectedRoute roles={['student']}><PerformancePage /></ProtectedRoute>} />
        <Route path="/dashboard/bookmarks" element={<ProtectedRoute roles={['student']}><BookmarksPage /></ProtectedRoute>} />
        <Route path="/dashboard/ai-tutor" element={<ProtectedRoute roles={['student']}><AiTutorPage /></ProtectedRoute>} />

        <Route path="/dashboard/notifications" element={<NotificationsPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/settings" element={<SettingsPage />} />
        <Route path="/dashboard/live" element={<Navigate to="/live-classes" replace />} />

        <Route path="/teacher" element={<ProtectedRoute roles={['teacher']}><TeacherOverviewPage /></ProtectedRoute>} />
        <Route path="/teacher/courses" element={<ProtectedRoute roles={['teacher']}><TeacherCoursesPage /></ProtectedRoute>} />
        <Route path="/teacher/courses/:courseId" element={<ProtectedRoute roles={['teacher']}><TeacherCourseManagePage /></ProtectedRoute>} />
        <Route path="/teacher/tests" element={<ProtectedRoute roles={['teacher']}><TeacherTestsPage /></ProtectedRoute>} />
        <Route path="/teacher/tests/:testId" element={<ProtectedRoute roles={['teacher']}><TeacherTestManagePage /></ProtectedRoute>} />
        <Route path="/teacher/live-classes" element={<ProtectedRoute roles={['teacher']}><TeacherLiveClassesPage /></ProtectedRoute>} />
        <Route path="/teacher/students" element={<ProtectedRoute roles={['teacher']}><TeacherStudentsPage /></ProtectedRoute>} />
        <Route path="/teacher/materials" element={<ProtectedRoute roles={['teacher']}><TeacherMaterialsPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminOverviewPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/courses" element={<ProtectedRoute roles={['admin']}><AdminCoursesPage /></ProtectedRoute>} />
        <Route path="/admin/teachers" element={<ProtectedRoute roles={['admin']}><AdminTeachersPage /></ProtectedRoute>} />
        <Route path="/admin/messages" element={<ProtectedRoute roles={['admin']}><AdminMessagesPage /></ProtectedRoute>} />
        <Route path="/admin/sessions" element={<ProtectedRoute roles={['admin']}><AdminSessionsPage /></ProtectedRoute>} />
        <Route path="/admin/integrations" element={<ProtectedRoute roles={['admin']}><AdminIntegrationsPage /></ProtectedRoute>} />

        <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />
        <Route path="/teacher/*" element={<Navigate to="/teacher" replace />} />
        <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  );
}
