import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import validate    from '../../middlewares/validate.middleware.js';
import * as schema from './order.schema.js';
import * as ctrl   from './order.controller.js';

const router = Router();

// User & Admin — role dibedakan di service level
// User hanya lihat ordernya sendiri, admin lihat semua

router.get ('/',    auth, ctrl.getOrders);
router.get ('/:id', auth, ctrl.getOrderById);
router.post('/',    auth, validate(schema.checkoutSchema), ctrl.checkout);

// Hanya user yang bisa cancel order miliknya sendiri (pending_payment saja)
router.delete('/:id', auth, ctrl.cancelOrder);

export default router;
