import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import admin       from '../../middlewares/admin.middleware.js';
import validate    from '../../middlewares/validate.middleware.js';
import * as schema from './ticket.schema.js';
import * as ctrl   from './ticket.controller.js';

const router = Router();

// ─── User — Tiket Sendiri ─────────────────────────────────────────────────────
// Route /my/* harus SEBELUM /:id agar "my" tidak dianggap sebagai ID

router.get('/my',                  auth, ctrl.getMyTickets);
router.get('/my/:id',              auth, ctrl.getMyTicketById);
router.get('/my/:id/download',     auth, ctrl.downloadTicket);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get ('/',          auth, admin, ctrl.getAllTickets);
router.get ('/:id',       auth, admin, ctrl.getTicketById);
router.post('/checkin',   auth, admin, validate(schema.checkinSchema), ctrl.checkIn);

export default router;
