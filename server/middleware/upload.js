import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { run } from '../config/db.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

function uploadRoot(userId) {
  const dir = path.join(env.uploadsDir, 'teacher', userId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    cb(null, uploadRoot(req.user.id));
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const allowed = {
  video: ['video/mp4', 'video/webm'],
  pdf: ['application/pdf'],
  image: ['image/jpeg', 'image/png', 'image/webp'],
};

export const upload = multer({
  storage,
  limits: { fileSize: 400 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const type = Object.entries(allowed).find(([, mimes]) => mimes.includes(file.mimetype));
    if (!type) {
      return cb(new ApiError(400, 'INVALID_FILE_TYPE', 'Upload an MP4/WEBM video, a PDF, or a JPG/PNG/WEBP image.'));
    }
    file.kind = type[0];
    cb(null, true);
  },
});

export function recordUpload(req, file) {
  const key = path.relative(env.uploadsDir, file.path).split(path.sep).join('/');
  const id = crypto.randomUUID();
  run(
    `INSERT INTO uploads (id, storage_key, original_name, mime, size, kind, uploaded_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    key,
    file.originalname,
    file.mimetype,
    file.size,
    file.kind,
    req.user.id,
    new Date().toISOString(),
  );
  return { id, key, name: file.originalname, size: file.size, mime: file.mimetype, kind: file.kind };
}
