import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import validate    from '../../middlewares/validate.middleware.js';
import * as schema from './order.schema.js';
import * as ctrl   from './order.controller.js';

const router = Router();

// User & Admin — role dibedakan di service level
router.get ('/',    auth, ctrl.getOrders);
router.get ('/:id', auth, ctrl.getOrderById);

// Checkout dari keranjang (multi-produk)
router.post('/',         auth, validate(schema.checkoutSchema),         ctrl.checkout);

// Checkout langsung dari halaman produk (bypass cart)
router.post('/express',  auth, validate(schema.expressCheckoutSchema),  ctrl.expressCheckout);

// Hanya user yang bisa cancel order miliknya sendiri (pending_payment saja)
router.delete('/:id', auth, ctrl.cancelOrder);

export default router;
