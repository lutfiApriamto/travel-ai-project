import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import admin       from '../../middlewares/admin.middleware.js';
import validate    from '../../middlewares/validate.middleware.js';
import * as schema from './notification.schema.js';
import * as ctrl   from './notification.controller.js';

const router = Router();

// ─── User endpoints ───────────────────────────────────────────────────────────
router.get ('/',              auth, ctrl.getMyNotifications);
router.get ('/unread-count',  auth, ctrl.getUnreadCount);
router.patch('/read-all',     auth, ctrl.markAllAsRead);
router.patch('/:id/read',     auth, ctrl.markAsRead);
router.delete('/:id',         auth, ctrl.deleteNotification);

// ─── Admin endpoint ───────────────────────────────────────────────────────────
router.post('/broadcast',     auth, admin, validate(schema.broadcastSchema), ctrl.broadcast);

export default router;
