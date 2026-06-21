import { Router }              from 'express';
import { createRateLimiter }  from '../../middlewares/rateLimiter.middleware.js';
import validate               from '../../middlewares/validate.middleware.js';
import * as schema            from './auth.schema.js';
import * as ctrl              from './auth.controller.js';

const router = Router();

// Max 10 request per 15 menit per IP — proteksi brute-force login/register/forgot.
// Di-skip otomatis saat development (lihat rateLimiter.middleware.js).
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max:      10,
  message:  'Terlalu banyak percobaan. Silakan coba lagi setelah 15 menit.',
});

// POST /api/auth/register
router.post('/register', authLimiter, validate(schema.registerSchema), ctrl.register);

// POST /api/auth/admin/register — inisialisasi akun admin (sekali pakai)
router.post('/admin/register', ctrl.registerAdmin);

// POST /api/auth/login
router.post('/login', authLimiter, validate(schema.loginSchema), ctrl.login);

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, validate(schema.forgotPasswordSchema), ctrl.forgotPassword);

// POST /api/auth/verify-reset-token/:token — cek token + email sebelum isi password baru
router.post('/verify-reset-token/:token', validate(schema.verifyResetTokenSchema), ctrl.verifyResetToken);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', validate(schema.resetPasswordSchema), ctrl.resetPassword);

// POST /api/auth/refresh — tukar refresh token (cookie) dengan access token baru
router.post('/refresh', ctrl.refresh);

// POST /api/auth/logout
router.post('/logout', ctrl.logout);

export default router;
