import { get, run } from '../config/db.js';
import { env } from '../config/env.js';
import { readToken, verifyToken } from '../utils/auth.js';
import { ApiError } from '../utils/http.js';

function loadUserFromToken(token) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Your session has expired. Please sign in again.');
  }

  const session = get('SELECT id, revoked_at FROM sessions WHERE id = ? AND user_id = ?', payload.jti, payload.sub);
  if (!session || session.revoked_at) throw ApiError.unauthorized('Your session is no longer active.');

  const user = get(
    `SELECT id, email, phone, role, name, avatar_color, status, email_verified, notification_prefs, created_at
     FROM users WHERE id = ? AND deleted_at IS NULL`,
    payload.sub,
  );
  if (!user) throw ApiError.unauthorized('Account not found.');
  if (user.status === 'suspended') throw ApiError.forbidden('This account has been suspended. Contact support.');

  const lastSeen = new Date(session.last_seen_at || 0).getTime();
  if (Date.now() - lastSeen > 5 * 60 * 1000) {
    run('UPDATE sessions SET last_seen_at = ? WHERE id = ?', new Date().toISOString(), session.id);
  }

  return { ...user, sessionId: session.id };
}

export function authenticate(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(ApiError.unauthorized());
  try {
    req.user = loadUserFromToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

export function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = loadUserFromToken(token);
  } catch {
    req.user = null;
  }
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('This area is restricted to ' + roles.join(' / ') + ' accounts.'));
    }
    next();
  };
}

export function requireApprovedTeacher(req, _res, next) {
  if (!req.user) return next(ApiError.unauthorized());
  if (req.user.role === 'admin') return next();
  if (req.user.role !== 'teacher') return next(ApiError.forbidden('Educator access only.'));
  const profile = get('SELECT approved FROM teacher_profiles WHERE user_id = ?', req.user.id);
  if (!profile?.approved) {
    return next(new ApiError(403, 'TEACHER_PENDING', 'Your educator account is awaiting administrator approval. You can complete your profile in the meantime.'));
  }
  next();
}

export function originGuard(req, _res, next) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (!origin) return next();
  const allowed = new Set([env.clientOrigin, `http://localhost:${env.port}`, `http://127.0.0.1:${env.port}`]);
  try {
    const originUrl = new URL(origin);
    if (originUrl.host === req.headers.host) return next();
    if (!env.isProd && /^(localhost|127\.0\.0\.1)$/.test(originUrl.hostname)) return next();
  } catch {
    /* ignore malformed origin */
  }
  if (!allowed.has(origin)) {
    return next(new ApiError(403, 'CSRF_BLOCKED', 'Request origin is not allowed.'));
  }
  next();
}
