import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimit.js';
import {
  register, registerSchema, login, loginSchema, logout, me, updateProfile, updateProfileSchema,
  changePassword, changePasswordSchema, listSessions, revokeSession, forgotPassword, forgotPasswordSchema,
  resetPassword, resetPasswordSchema, getNotificationPrefs, updateNotificationPrefs,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', registerLimiter, validate({ body: registerSchema }), register);
router.post('/login', authLimiter, validate({ body: loginSchema }), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), updateProfile);
router.patch('/password', authenticate, validate({ body: changePasswordSchema }), changePassword);
router.get('/sessions', authenticate, listSessions);
router.delete('/sessions/:id', authenticate, revokeSession);
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', authLimiter, validate({ body: resetPasswordSchema }), resetPassword);
router.get('/notification-prefs', authenticate, getNotificationPrefs);
router.put('/notification-prefs', authenticate, updateNotificationPrefs);

export default router;
