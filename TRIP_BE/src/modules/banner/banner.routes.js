import { Router }                    from 'express';
import auth                          from '../../middlewares/auth.middleware.js';
import admin                         from '../../middlewares/admin.middleware.js';
import upload, { handleUploadError } from '../../middlewares/upload.middleware.js';
import validate                      from '../../middlewares/validate.middleware.js';
import * as schema                   from './banner.schema.js';
import * as ctrl                     from './banner.controller.js';

const router = Router();

// ─── Public — Read ────────────────────────────────────────────────────────────

router.get('/',    ctrl.getAll);
router.get('/:id', ctrl.getById);

// ─── Admin — CRUD ─────────────────────────────────────────────────────────────

router.post  ('/',    auth, admin, upload.single('image'), handleUploadError, validate(schema.createBannerSchema), ctrl.create);
router.patch ('/:id', auth, admin, upload.single('image'), handleUploadError, validate(schema.updateBannerSchema), ctrl.update);
router.delete('/:id', auth, admin, ctrl.remove);

export default router;
