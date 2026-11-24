import { get, all } from '../config/db.js';
import { ApiError } from '../utils/http.js';
import { env } from '../config/env.js';

export function getEnrollment(userId, courseId) {
  if (!userId) return null;
  return get(
    `SELECT * FROM enrollments
     WHERE user_id = ? AND course_id = ? AND status = 'active'
     AND (expires_at IS NULL OR expires_at > ?)`,
    userId,
    courseId,
    new Date().toISOString(),
  );
}

export function isCourseOwner(user, courseId) {
  if (!user || user.role !== 'teacher') return false;
  const course = get('SELECT teacher_id FROM courses WHERE id = ?', courseId);
  return course?.teacher_id === user.id;
}

export function hasCourseAccess(user, courseId) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (isCourseOwner(user, courseId)) return true;
  return Boolean(getEnrollment(user.id, courseId));
}

export function assertCourseAccess(user, courseId, message = 'Enroll in this course to unlock this content.') {
  if (!hasCourseAccess(user, courseId)) {
    if (!user) throw ApiError.unauthorized();
    throw ApiError.forbidden(message);
  }
}

export function assertCourseManager(user, courseId) {
  if (!user) throw ApiError.unauthorized();
  if (user.role === 'admin') return;
  if (isCourseOwner(user, courseId)) return;
  throw ApiError.forbidden('You can only manage courses assigned to you.');
}

export function canAccessMaterial(user, material) {
  if (!user) return false;
  if (!material.is_premium) return true;
  if (user.role === 'admin') return true;
  if (material.course_id) return hasCourseAccess(user, material.course_id);
  return all(
    `SELECT 1 FROM enrollments WHERE user_id = ? AND status = 'active'
     AND (expires_at IS NULL OR expires_at > ?) LIMIT 1`,
    user.id,
    new Date().toISOString(),
  ).length > 0;
}

export function requireIntegration(name) {
  if (!env.integrations[name]) {
    const labels = {
      livekit: 'Live video streaming (LiveKit)',
      razorpay: 'Online payments (Razorpay)',
      llm: 'AI tutoring (LLM API)',
      smtp: 'Email delivery (SMTP)',
      s3: 'Cloud media storage (S3)',
    };
    throw ApiError.notConfigured(
      name,
      `${labels[name] || name} is not configured on this deployment. An administrator can enable it with server environment variables.`,
    );
  }
}
