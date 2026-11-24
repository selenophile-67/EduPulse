import { Router } from 'express';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listCourses, courseFilters, courseDetails, courseCategories, featuredCourses, listReviews,
  upsertReview, upsertReviewSchema, enrollCourse, myEnrollments, toggleBookmark, bookmarkSchema, listBookmarks,
} from '../controllers/courses.controller.js';
import { z } from 'zod';

const router = Router();

router.get('/', optionalAuth, listCourses);
router.get('/filters', courseFilters);
router.get('/categories', courseCategories);
router.get('/featured', featuredCourses);
router.get('/:slug', optionalAuth, courseDetails);
router.get('/:slug/reviews', listReviews);
router.post('/:slug/reviews', authenticate, validate({ body: upsertReviewSchema }), upsertReview);

export const enrollmentRouter = Router();
enrollmentRouter.get('/mine', authenticate, myEnrollments);
enrollmentRouter.post(
  '/',
  authenticate,
  requireRole('student'),
  validate({ body: z.object({ courseId: z.string().uuid() }) }),
  enrollCourse,
);

export const bookmarkRouter = Router();
bookmarkRouter.get('/', authenticate, listBookmarks);
bookmarkRouter.post('/', authenticate, validate({ body: bookmarkSchema }), toggleBookmark);

export default router;
