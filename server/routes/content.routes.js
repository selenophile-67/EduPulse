import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { publicFormLimiter } from '../middleware/rateLimit.js';
import {
  homeContent, faqs, subscribeNewsletter, newsletterSchema, contact, contactSchema, configStatus,
} from '../controllers/content.controller.js';

const router = Router();
router.get('/home', homeContent);
router.get('/faqs', faqs);
router.get('/config', configStatus);
router.post('/newsletter', publicFormLimiter, validate({ body: newsletterSchema }), subscribeNewsletter);
router.post('/contact', publicFormLimiter, validate({ body: contactSchema }), contact);

export default router;
