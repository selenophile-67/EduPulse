import { Router } from 'express';
import { globalSearch, searchSuggestions, popularSearches } from '../controllers/search.controller.js';

const router = Router();
router.get('/', globalSearch);
router.get('/suggest', searchSuggestions);
router.get('/popular', popularSearches);

export default router;
