import { ApiError } from '../utils/http.js';

export function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        const parsed = schemas.body.safeParse(req.body);
        if (!parsed.success) {
          throw ApiError.badRequest('Please check the highlighted fields.', parsed.error.flatten().fieldErrors);
        }
        req.body = parsed.data;
      }
      if (schemas.query) {
        const parsed = schemas.query.safeParse(req.query);
        if (!parsed.success) {
          throw ApiError.badRequest('Invalid query parameters.', parsed.error.flatten().fieldErrors);
        }
        req.validatedQuery = parsed.data;
      }
      if (schemas.params) {
        const parsed = schemas.params.safeParse(req.params);
        if (!parsed.success) {
          throw ApiError.badRequest('Invalid route parameters.', parsed.error.flatten().fieldErrors);
        }
        req.params = parsed.data;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
