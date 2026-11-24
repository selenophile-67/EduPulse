export class ApiError extends Error {
  constructor(status, code, message, details = undefined) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message = 'Invalid request', details) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }
  static unauthorized(message = 'Please sign in to continue') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }
  static forbidden(message = 'You do not have access to this resource') {
    return new ApiError(403, 'FORBIDDEN', message);
  }
  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }
  static conflict(message = 'Already exists') {
    return new ApiError(409, 'CONFLICT', message);
  }
  static notConfigured(service, message) {
    return new ApiError(503, 'NOT_CONFIGURED', message, { service });
  }
  static paymentRequired(message) {
    return new ApiError(402, 'PAYMENT_REQUIRED', message);
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function sendData(res, data, status = 200) {
  return res.status(status).json({ data });
}
