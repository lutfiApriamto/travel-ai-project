import { Router }                    from 'express';
import auth                          from '../../middlewares/auth.middleware.js';
import admin                         from '../../middlewares/admin.middleware.js';
import upload, { handleUploadError } from '../../middlewares/upload.middleware.js';
import validate                      from '../../middlewares/validate.middleware.js';
import * as schema                   from './upload.schema.js';
import * as ctrl                     from './upload.controller.js';

const router = Router();

// Semua endpoint upload/delete hanya untuk admin
// Query param ?folder=xxx menentukan subfolder di Supabase (default: 'uploads')

router.post('/single', auth, admin, upload.single('image'),       handleUploadError, ctrl.uploadSingle);
router.post('/bulk',   auth, admin, upload.array('images', 10),   handleUploadError, ctrl.uploadBulk);

router.delete('/single', auth, admin, validate(schema.deleteImageSchema),  ctrl.deleteSingle);
router.delete('/bulk',   auth, admin, validate(schema.deleteImagesSchema), ctrl.deleteBulk);

export default router;
