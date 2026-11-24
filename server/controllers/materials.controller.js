import crypto from 'node:crypto';
import { all, get, run } from '../config/db.js';
import { mapMaterial } from '../models/serialize.js';
import { parsePagination, paginated, nowIso } from '../utils/misc.js';
import { asyncHandler, ApiError, sendData } from '../utils/http.js';
import { canAccessMaterial } from '../services/access.service.js';

export const listMaterials = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { limit: 12 });
  const { q, exam, category, subject, premium, sort = 'newest' } = req.query;
  const where = ['1 = 1'];
  const params = [];
  if (q) {
    const term = `%${String(q).trim()}%`;
    where.push('(m.title LIKE ? OR m.description LIKE ? OR m.subject LIKE ? OR m.chapter_name LIKE ?)');
    params.push(term, term, term, term);
  }
  if (exam) {
    where.push('m.exam = ?');
    params.push(exam);
  }
  if (category) {
    where.push('m.category = ?');
    params.push(category);
  }
  if (subject) {
    where.push('m.subject = ?');
    params.push(subject);
  }
  if (premium === 'free') where.push('m.is_premium = 0');
  if (premium === 'premium') where.push('m.is_premium = 1');

  const order = sort === 'popular' ? 'm.download_count DESC' : 'm.created_at DESC';
  const items = all(
    `SELECT m.*, c.title AS course_title FROM study_materials m
     LEFT JOIN courses c ON c.id = m.course_id
     WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  ).map((m) => {
    const material = mapMaterial(m);
    if (req.user) {
      material.canDownload = canAccessMaterial(req.user, m);
      material.bookmarked = Boolean(
        get(
          `SELECT id FROM bookmarks WHERE user_id = ? AND entity_type = 'material' AND entity_id = ?`,
          req.user.id,
          m.id,
        ),
      );
    }
    return material;
  });
  const total = get(`SELECT COUNT(*) AS count FROM study_materials m WHERE ${where.join(' AND ')}`, ...params);
  return sendData(res, paginated(items, total?.count ?? 0, page, limit));
});

export const materialMeta = asyncHandler(async (_req, res) => {
  const exams = all('SELECT exam, COUNT(*) AS count FROM study_materials GROUP BY exam ORDER BY count DESC');
  const categories = all('SELECT category, COUNT(*) AS count FROM study_materials GROUP BY category ORDER BY count DESC');
  const subjects = all(
    'SELECT subject, COUNT(*) AS count FROM study_materials WHERE subject IS NOT NULL GROUP BY subject ORDER BY count DESC',
  );
  return sendData(res, { exams, categories, subjects });
});

export const materialDetail = asyncHandler(async (req, res) => {
  const row = get(
    `SELECT m.*, c.title AS course_title FROM study_materials m
     LEFT JOIN courses c ON c.id = m.course_id WHERE m.id = ?`,
    req.params.id,
  );
  if (!row) throw ApiError.notFound('Material not found.');
  const canDownload = req.user ? canAccessMaterial(req.user, row) : !row.is_premium;
  if (req.user) {
    run(
      'INSERT INTO material_views (id, user_id, material_id, viewed_at) VALUES (?, ?, ?, ?)',
      crypto.randomUUID(),
      req.user.id,
      row.id,
      nowIso(),
    );
  }
  const related = all(
    `SELECT m.*, c.title AS course_title FROM study_materials m LEFT JOIN courses c ON c.id = m.course_id
     WHERE m.exam = ? AND m.id != ? ORDER BY m.download_count DESC LIMIT 4`,
    row.exam,
    row.id,
  ).map((m) => mapMaterial(m));
  return sendData(res, {
    material: { ...mapMaterial(row), canDownload },
    related,
  });
});

export const recentMaterials = asyncHandler(async (req, res) => {
  const rows = all(
    `SELECT m.*, c.title AS course_title, MAX(v.viewed_at) AS viewed_at
     FROM material_views v JOIN study_materials m ON m.id = v.material_id
     LEFT JOIN courses c ON c.id = m.course_id
     WHERE v.user_id = ? GROUP BY m.id ORDER BY viewed_at DESC LIMIT 8`,
    req.user.id,
  );
  return sendData(res, {
    materials: rows.map((m) => ({ ...mapMaterial(m), viewedAt: m.viewed_at })),
  });
});
