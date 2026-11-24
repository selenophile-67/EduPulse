import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  learningOverview, myCourse, lectureDetails, saveLectureProgress, saveProgressSchema,
  completeLecture, learningCalendar, learningPerformance,
} from '../controllers/learning.controller.js';

const router = Router();
router.use(authenticate);

router.get('/overview', learningOverview);
router.get('/performance', learningPerformance);
router.get('/calendar', learningCalendar);
router.get('/courses/:courseId', myCourse);
router.get('/lectures/:lectureId', lectureDetails);
router.put('/lectures/:lectureId/progress', validate({ body: saveProgressSchema }), saveLectureProgress);
router.post('/lectures/:lectureId/complete', completeLecture);

export default router;
