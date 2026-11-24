import { Router } from 'express';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { attemptLimiter } from '../middleware/rateLimit.js';
import {
  listTests, testMeta, testDetails, beginAttempt, getAttempt, patchAttempt, finishAttempt,
  resultDetail, leaderboard, myTestAttempts, publicResults,
} from '../controllers/tests.controller.js';

const router = Router();

router.get('/', optionalAuth, listTests);
router.get('/meta', testMeta);
router.get('/public-results', publicResults);
router.get('/my-attempts', authenticate, myTestAttempts);
router.get('/results/:resultId', authenticate, resultDetail);
router.get('/attempts/:attemptId', authenticate, getAttempt);
router.patch('/attempts/:attemptId', authenticate, attemptLimiter, patchAttempt);
router.post('/attempts/:attemptId/submit', authenticate, attemptLimiter, finishAttempt);
router.get('/:id/leaderboard', leaderboard);
router.get('/:id', optionalAuth, testDetails);
router.post('/:id/attempts', authenticate, requireRole('student'), attemptLimiter, beginAttempt);

export default router;
