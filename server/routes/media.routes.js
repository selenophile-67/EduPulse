import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { streamLectureVideo, streamMaterial } from '../controllers/media.controller.js';

const router = Router();
router.get('/video/:lectureId', optionalAuth, streamLectureVideo);
router.get('/material/:id', optionalAuth, streamMaterial);

export default router;
