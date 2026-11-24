import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  listMaterials, materialMeta, materialDetail, recentMaterials,
} from '../controllers/materials.controller.js';

const router = Router();
router.get('/', optionalAuth, listMaterials);
router.get('/meta', materialMeta);
router.get('/recent', authenticate, recentMaterials);
router.get('/:id', optionalAuth, materialDetail);

export default router;
