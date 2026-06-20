import { Router }  from 'express';
import auth         from '../../middlewares/auth.middleware.js';
import admin        from '../../middlewares/admin.middleware.js';
import optionalAuth from '../../middlewares/optionalAuth.middleware.js';
import validate     from '../../middlewares/validate.middleware.js';
import * as schema  from './product.schema.js';
import * as ctrl    from './product.controller.js';

const router = Router();

// ─── Public / OptionalAuth — Read ────────────────────────────────────────────
// Admin melihat semua status, publik hanya melihat 'active'

router.get('/',           optionalAuth, ctrl.getAll);
router.get('/slug/:slug', optionalAuth, ctrl.getBySlug);   // BEFORE /:id
router.get('/:id',        optionalAuth, ctrl.getById);

// ─── Admin — Write ────────────────────────────────────────────────────────────

router.post  ('/',               auth, admin, validate(schema.createProductSchema), ctrl.create);
router.post  ('/:id/duplicate',  auth, admin, ctrl.duplicate);
router.patch ('/bulk-status',    auth, admin, validate(schema.bulkStatusSchema),    ctrl.bulkUpdateStatus);  // BEFORE /:id
router.patch ('/:id',            auth, admin, validate(schema.updateProductSchema), ctrl.update);
router.delete('/:id',            auth, admin, ctrl.remove);

export default router;
