import { Router }                        from 'express';
import optionalAuth                      from '../../middlewares/optionalAuth.middleware.js';
import auth                              from '../../middlewares/auth.middleware.js';
import admin                             from '../../middlewares/admin.middleware.js';
import upload, { handleUploadError }     from '../../middlewares/upload.middleware.js';
import validate                          from '../../middlewares/validate.middleware.js';
import * as schema                       from './category.schema.js';
import * as ctrl                         from './category.controller.js';

const router = Router();

// ─── Public — Read ────────────────────────────────────────────────────────────
// GET /?search=  — admin: semua status | public: active saja (via optionalAuth)
// /slug/:slug harus didaftarkan sebelum /:id agar tidak tertangkap sebagai ID

router.get('/',           optionalAuth, ctrl.getAll);
router.get('/slug/:slug', ctrl.getBySlug);
router.get('/:id',        ctrl.getById);

// ─── Admin — CRUD ─────────────────────────────────────────────────────────────

router.post  ('/',    auth, admin, upload.single('image'), handleUploadError, validate(schema.createCategorySchema), ctrl.create);
router.patch ('/:id', auth, admin, upload.single('image'), handleUploadError, validate(schema.updateCategorySchema), ctrl.update);
router.delete('/:id', auth, admin, ctrl.remove);

export default router;
