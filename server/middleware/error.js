import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`No API route matches ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, req, res, _next) {
  if (error?.name === 'MulterError') {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'That file is too large. Videos can be up to 400 MB; PDFs up to 30 MB.'
        : `Upload failed: ${error.message}`;
    return res.status(400).json({ error: { code: 'UPLOAD_FAILED', message } });
  }
  const status = error.status || 500;
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, error);
  }
  const payload = {
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: status >= 500 && env.isProd ? 'Something went wrong on our side. Please try again.' : error.message,
    },
  };
  if (error.details) payload.error.details = error.details;
  res.status(status).json(payload);
}
