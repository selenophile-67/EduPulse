import fs from 'node:fs';
import path from 'node:path';
import { get, run } from '../config/db.js';
import { env } from '../config/env.js';
import { asyncHandler, ApiError } from '../utils/http.js';
import { hasCourseAccess, canAccessMaterial } from '../services/access.service.js';
import { slugify } from '../utils/misc.js';

function resolveUploadedFile(key) {
  if (!key) return null;
  const resolved = path.resolve(env.uploadsDir, key);
  const root = path.resolve(env.uploadsDir) + path.sep;
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

export const streamLectureVideo = asyncHandler(async (req, res) => {
  const lecture = get('SELECT * FROM lectures WHERE id = ?', req.params.lectureId);
  if (!lecture) throw ApiError.notFound('Lecture not found.');
  if (!lecture.is_preview) {
    if (!req.user) throw ApiError.unauthorized('Sign in and enroll in the course to watch this lecture.');
    if (!hasCourseAccess(req.user, lecture.course_id)) {
      throw ApiError.forbidden('Enroll in this course to watch this lecture.');
    }
  }
  if (lecture.external_video_url) return res.redirect(lecture.external_video_url);
  const filePath = resolveUploadedFile(lecture.video_key);
  if (!filePath || !fs.existsSync(filePath)) {
    throw ApiError.notFound('The video for this lecture has not been uploaded yet.');
  }
  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  return res.sendFile(filePath);
});

export const streamMaterial = asyncHandler(async (req, res) => {
  const material = get('SELECT * FROM study_materials WHERE id = ?', req.params.id);
  if (!material) throw ApiError.notFound('Material not found.');
  if (material.is_premium) {
    if (!req.user) throw ApiError.unauthorized('This is a premium resource. Sign in with an enrolled account.');
    if (!canAccessMaterial(req.user, material)) {
      throw ApiError.forbidden('This resource is part of a course. Enroll to unlock it.');
    }
  }
  const filePath = resolveUploadedFile(material.file_key);
  if (!filePath || !fs.existsSync(filePath)) {
    throw ApiError.notFound('This PDF has not been uploaded yet.');
  }
  if (req.user && req.query.download === '1') {
    run('UPDATE study_materials SET download_count = download_count + 1 WHERE id = ?', material.id);
  }
  const disposition = req.query.download === '1' ? 'attachment' : 'inline';
  const filename = `${slugify(material.title) || 'edupulse-material'}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
  res.setHeader('Cache-Control', 'private, max-age=600');
  return res.sendFile(filePath);
});
