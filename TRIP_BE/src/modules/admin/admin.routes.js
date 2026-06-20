import { Router }            from 'express';
import auth                  from '../../middlewares/auth.middleware.js';
import admin                 from '../../middlewares/admin.middleware.js';
import { createRateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import * as ctrl             from './admin.controller.js';

const router = Router();

// Rate limiter khusus dashboard — endpoint ini jalankan 11 query paralel + aggregation
// Cegah spam yang bisa membebani MongoDB
const dashboardLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max:      20,
  message:  'Terlalu banyak request ke dashboard. Coba lagi dalam 1 menit.',
});

// Semua endpoint admin — wajib login sebagai admin
router.get ('/dashboard',          auth, admin, dashboardLimiter, ctrl.getDashboard);
router.get ('/users',              auth, admin, ctrl.getUsers);
router.get ('/users/:id',          auth, admin, ctrl.getUserDetail);
router.patch('/users/:id/suspend', auth, admin, ctrl.toggleSuspend);

export default router;
