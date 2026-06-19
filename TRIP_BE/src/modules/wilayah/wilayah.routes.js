import { Router } from 'express';
import auth        from '../../middlewares/auth.middleware.js';
import admin       from '../../middlewares/admin.middleware.js';
import validate    from '../../middlewares/validate.middleware.js';
import * as schema from './wilayah.schema.js';
import * as ctrl   from './wilayah.controller.js';

const router = Router();

// ─── Public — Read ────────────────────────────────────────────────────────────
// Query params tersedia di semua level:
//   provinces  → ?search=
//   regencies  → ?province_id=&search=
//   districts  → ?regency_id=&search=
//   villages   → ?district_id=&search=  (wajib salah satu filter)

router.get('/provinces', ctrl.getProvinces);
router.get('/regencies', ctrl.getRegencies);
router.get('/districts', ctrl.getDistricts);
router.get('/villages',  ctrl.getVillages);

// ─── Admin — Province ─────────────────────────────────────────────────────────

router.post  ('/provinces',     auth, admin, validate(schema.createProvinceSchema), ctrl.createProvince);
router.patch ('/provinces/:id', auth, admin, validate(schema.updateProvinceSchema), ctrl.updateProvince);
router.delete('/provinces/:id', auth, admin,                                        ctrl.deleteProvince);

// ─── Admin — Regency ──────────────────────────────────────────────────────────

router.post  ('/regencies',     auth, admin, validate(schema.createRegencySchema), ctrl.createRegency);
router.patch ('/regencies/:id', auth, admin, validate(schema.updateRegencySchema), ctrl.updateRegency);
router.delete('/regencies/:id', auth, admin,                                       ctrl.deleteRegency);

// ─── Admin — District ─────────────────────────────────────────────────────────

router.post  ('/districts',     auth, admin, validate(schema.createDistrictSchema), ctrl.createDistrict);
router.patch ('/districts/:id', auth, admin, validate(schema.updateDistrictSchema), ctrl.updateDistrict);
router.delete('/districts/:id', auth, admin,                                        ctrl.deleteDistrict);

// ─── Admin — Village ──────────────────────────────────────────────────────────

router.post  ('/villages',     auth, admin, validate(schema.createVillageSchema), ctrl.createVillage);
router.patch ('/villages/:id', auth, admin, validate(schema.updateVillageSchema), ctrl.updateVillage);
router.delete('/villages/:id', auth, admin,                                       ctrl.deleteVillage);

export default router;
