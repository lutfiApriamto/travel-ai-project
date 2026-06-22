import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import * as ctrl   from './passenger.controller.js';

const router = Router();

router.get   ('/',    auth, ctrl.getMyPassengers);
router.post  ('/',    auth, ctrl.upsertPassenger);
router.delete('/:id', auth, ctrl.deletePassenger);

export default router;
