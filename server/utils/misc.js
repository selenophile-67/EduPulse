import { ApiError } from './http.js';

export function parsePagination(query, defaults = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(defaults.max || 48, Math.max(1, Number.parseInt(query.limit, 10) || defaults.limit || 12));
  return { page, limit, offset: (page - 1) * limit };
}

export function paginated(items, total, page, limit) {
  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export function nowIso() {
  return new Date().toISOString();
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function parseJson(value, fallback = []) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function ensureFound(value, message = 'Resource not found') {
  if (!value) throw ApiError.notFound(message);
  return value;
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
