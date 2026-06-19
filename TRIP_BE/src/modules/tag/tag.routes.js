import { Router }   from 'express';
import optionalAuth from '../../middlewares/optionalAuth.middleware.js';
import auth         from '../../middlewares/auth.middleware.js';
import admin        from '../../middlewares/admin.middleware.js';
import validate     from '../../middlewares/validate.middleware.js';
import * as schema  from './tag.schema.js';
import * as ctrl    from './tag.controller.js';

const router = Router();

// ─── Public — Read ────────────────────────────────────────────────────────────

router.get('/',           optionalAuth, ctrl.getAll);
router.get('/slug/:slug', ctrl.getBySlug);
router.get('/:id',        ctrl.getById);

// ─── Admin — CRUD ─────────────────────────────────────────────────────────────

router.post  ('/',    auth, admin, validate(schema.createTagSchema), ctrl.create);
router.patch ('/:id', auth, admin, validate(schema.updateTagSchema), ctrl.update);
router.delete('/:id', auth, admin, ctrl.remove);

export default router;
