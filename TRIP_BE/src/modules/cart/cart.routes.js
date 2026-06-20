import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import validate    from '../../middlewares/validate.middleware.js';
import * as schema from './cart.schema.js';
import * as ctrl   from './cart.controller.js';

const router = Router();

// Semua endpoint cart wajib login
router.get   ('/',                 auth, ctrl.getCart);
router.post  ('/items',            auth, validate(schema.addCartItemSchema),    ctrl.addItem);
router.patch ('/items/:productId', auth, validate(schema.updateCartItemSchema), ctrl.updateItem);
router.delete('/items/:productId', auth, ctrl.removeItem);
router.delete('/',                 auth, ctrl.clearCart);

export default router;
