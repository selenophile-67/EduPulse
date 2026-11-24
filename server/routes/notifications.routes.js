import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  listNotifications, markRead, markAllRead, deleteNotification, notificationBadge,
} from '../controllers/notifications.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.get('/badge', notificationBadge);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/:id', deleteNotification);

export default router;
