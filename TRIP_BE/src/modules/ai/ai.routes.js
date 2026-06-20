import { Router }            from 'express';
import auth                  from '../../middlewares/auth.middleware.js';
import validate              from '../../middlewares/validate.middleware.js';
import { createRateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import * as schema           from './ai.schema.js';
import * as ctrl             from './ai.controller.js';

const router = Router();

// Rate limiter ketat — cegah abuse & pembengkakan biaya Gemini API
// Di production: maks 20 request per 15 menit per IP
// Di development: otomatis di-skip (lihat rateLimiter.middleware.js)
const aiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max:      20,
  message:  'Terlalu banyak percakapan dengan AI. Silakan coba lagi dalam 15 menit.',
});

router.post('/chat', auth, aiLimiter, validate(schema.chatSchema), ctrl.chat);

export default router;
