import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import admin       from '../../middlewares/admin.middleware.js';
import validate    from '../../middlewares/validate.middleware.js';
import * as schema from './refund.schema.js';
import * as ctrl   from './refund.controller.js';

const router = Router();

// ─── Policy — publik (user perlu tahu sebelum mengajukan) ─────────────────────
// Harus SEBELUM /:id agar "policy" tidak dianggap sebagai ObjectId

router.get  ('/policy', ctrl.getPolicy);
router.patch('/policy', auth, admin, validate(schema.updatePolicySchema), ctrl.updatePolicy);

// ─── User — Refund Sendiri ────────────────────────────────────────────────────
// /my/* harus SEBELUM /:id

router.get ('/my',     auth, ctrl.getMyRefunds);
router.get ('/my/:id', auth, ctrl.getMyRefundById);
router.post('/',       auth, validate(schema.submitRefundSchema), ctrl.submitRefund);

// ─── Admin ────────────────────────────────────────────────────────────────────

router.get  ('/',                    auth, admin, ctrl.getAllRefunds);
router.get  ('/:id',                 auth, admin, ctrl.getRefundById);
router.patch('/:id/approve',         auth, admin, ctrl.approveRefund);
router.patch('/:id/reject',          auth, admin, validate(schema.rejectRefundSchema), ctrl.rejectRefund);

export default router;
