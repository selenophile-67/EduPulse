import { Router } from 'express';
import { authenticate, optionalAuth, requireRole, requireApprovedTeacher } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listLiveClasses, liveClassDetail, createLiveClass, updateLiveClass, joinLiveClass,
  classAttendance, teacherLiveClasses, liveIntegrationStatus, liveClassSchema, updateLiveClassSchema,
} from '../controllers/liveClasses.controller.js';

const router = Router();

router.get('/status', liveIntegrationStatus);
router.get('/', optionalAuth, listLiveClasses);
router.get('/teacher/mine', authenticate, requireRole('teacher', 'admin'), teacherLiveClasses);
router.post('/', authenticate, requireRole('teacher', 'admin'), requireApprovedTeacher, validate({ body: liveClassSchema }), createLiveClass);
router.get('/:id', optionalAuth, liveClassDetail);
router.patch('/:id', authenticate, requireRole('teacher', 'admin'), validate({ body: updateLiveClassSchema }), updateLiveClass);
router.post('/:id/join', authenticate, requireRole('student'), joinLiveClass);
router.get('/:id/attendance', authenticate, requireRole('teacher', 'admin'), classAttendance);

export default router;
