import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  overview, listUsers, createUser, updateUser, resetUserPassword, approveTeacher, listPendingTeachers,
  listCourses, updateCourse, deleteCourse, listMessages, updateMessage, listSessions, health,
  confirmPaymentDisabled, createUserSchema, updateUserSchema, resetPasswordSchema, adminCourseSchema,
} from '../controllers/admin.controller.js';
import { z } from 'zod';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/overview', overview);
router.get('/health', health);

router.get('/users', listUsers);
router.post('/users', validate({ body: createUserSchema }), createUser);
router.patch('/users/:id', validate({ body: updateUserSchema }), updateUser);
router.post('/users/:id/reset-password', validate({ body: resetPasswordSchema }), resetUserPassword);

router.get('/teachers/pending', listPendingTeachers);
router.post('/teachers/:id/approve', approveTeacher);

router.get('/courses', listCourses);
router.patch('/courses/:id', validate({ body: adminCourseSchema }), updateCourse);
router.delete('/courses/:id', deleteCourse);

router.get('/messages', listMessages);
router.patch('/messages/:id', validate({ body: z.object({ status: z.enum(['new', 'read', 'resolved']) }) }), updateMessage);
router.get('/sessions', listSessions);

router.post('/payments/checkout', confirmPaymentDisabled);

export default router;
