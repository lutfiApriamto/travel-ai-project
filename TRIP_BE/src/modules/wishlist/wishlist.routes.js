import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import * as ctrl   from './wishlist.controller.js';

const router = Router();

// Semua endpoint wishlist wajib login
router.get ('/',                    auth, ctrl.getWishlist);
router.get ('/check/:productId',    auth, ctrl.checkWishlist);   // BEFORE /:productId
router.post('/:productId',          auth, ctrl.addToWishlist);
router.delete('/:productId',        auth, ctrl.removeFromWishlist);

export default router;
