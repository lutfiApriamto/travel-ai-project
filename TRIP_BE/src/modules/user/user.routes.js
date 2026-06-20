import { Router }             from 'express';
import auth                   from '../../middlewares/auth.middleware.js';
import admin                  from '../../middlewares/admin.middleware.js';
import validate               from '../../middlewares/validate.middleware.js';
import { createRateLimiter }  from '../../middlewares/rateLimiter.middleware.js';
import * as schema            from './user.schema.js';
import * as ctrl              from './user.controller.js';

const router = Router();

// Max 5 percobaan per 15 menit — proteksi brute-force ganti password
const changePasswordLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max:      5,
  message:  'Terlalu banyak percobaan ganti password. Silakan coba lagi setelah 15 menit.',
});

// ─── User — Profil Sendiri ────────────────────────────────────────────────────
// /me dan /me/change-password harus SEBELUM /:id

router.get  ('/me',                 auth, ctrl.getMe);
router.patch('/me',                 auth, validate(schema.updateMeSchema),       ctrl.updateMe);
router.patch('/me/change-password', auth, changePasswordLimiter, validate(schema.changePasswordSchema), ctrl.changePassword);

// ─── Admin — Manajemen User ───────────────────────────────────────────────────

router.get  ('/',            auth, admin, ctrl.getAllUsers);
router.get  ('/:id',         auth, admin, ctrl.getUserById);
router.patch('/:id/suspend', auth, admin, ctrl.toggleSuspend);

export default router;
