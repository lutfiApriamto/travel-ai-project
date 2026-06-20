import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import admin       from '../../middlewares/admin.middleware.js';
import validate    from '../../middlewares/validate.middleware.js';
import * as schema from './finance.schema.js';
import * as ctrl   from './finance.controller.js';

const router = Router();

// Semua endpoint finance hanya untuk admin
router.get ('/balance',          auth, admin, ctrl.getBalance);
router.get ('/transactions',     auth, admin, ctrl.getTransactions);
router.post('/withdraw',         auth, admin, validate(schema.withdrawSchema), ctrl.withdraw);
router.get ('/export/csv',       auth, admin, ctrl.exportCsv);

export default router;
