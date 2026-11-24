import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

function build(options) {
  return rateLimit({
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: () => env.isTest,
    ...options,
    handler: (_req, res) =>
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many attempts. Please wait a moment and try again.',
        },
      }),
  });
}

export const authLimiter = build({ windowMs: 15 * 60 * 1000, limit: 20 });
export const registerLimiter = build({ windowMs: 60 * 60 * 1000, limit: 10 });
export const publicFormLimiter = build({ windowMs: 60 * 60 * 1000, limit: 20 });
export const attemptLimiter = build({ windowMs: 60 * 1000, limit: 120 });
