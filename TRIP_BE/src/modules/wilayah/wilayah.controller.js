import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './wilayah.service.js';

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getProvinces = asyncHandler(async (req, res) => {
  const data = await svc.getProvinces(req.query.search);
  sendSuccess(res, data, 'Data provinsi berhasil diambil');
});

export const getRegencies = asyncHandler(async (req, res) => {
  const data = await svc.getRegencies(req.query.province_id, req.query.search);
  sendSuccess(res, data, 'Data kabupaten/kota berhasil diambil');
});

export const getDistricts = asyncHandler(async (req, res) => {
  const data = await svc.getDistricts(req.query.regency_id, req.query.search);
  sendSuccess(res, data, 'Data kecamatan berhasil diambil');
});

export const getVillages = asyncHandler(async (req, res) => {
  const data = await svc.getVillages(req.query.district_id, req.query.search);
  sendSuccess(res, data, 'Data desa/kelurahan berhasil diambil');
});

// ─── Province CRUD ────────────────────────────────────────────────────────────

export const createProvince = asyncHandler(async (req, res) => {
  const data = await svc.createProvince(req.body);
  sendSuccess(res, data, 'Provinsi berhasil ditambahkan', 201);
});

export const updateProvince = asyncHandler(async (req, res) => {
  const data = await svc.updateProvince(req.params.id, req.body);
  sendSuccess(res, data, 'Provinsi berhasil diperbarui');
});

export const deleteProvince = asyncHandler(async (req, res) => {
  await svc.deleteProvince(req.params.id);
  sendSuccess(res, null, 'Provinsi berhasil dihapus');
});

// ─── Regency CRUD ─────────────────────────────────────────────────────────────

export const createRegency = asyncHandler(async (req, res) => {
  const data = await svc.createRegency(req.body);
  sendSuccess(res, data, 'Kabupaten/kota berhasil ditambahkan', 201);
});

export const updateRegency = asyncHandler(async (req, res) => {
  const data = await svc.updateRegency(req.params.id, req.body);
  sendSuccess(res, data, 'Kabupaten/kota berhasil diperbarui');
});

export const deleteRegency = asyncHandler(async (req, res) => {
  await svc.deleteRegency(req.params.id);
  sendSuccess(res, null, 'Kabupaten/kota berhasil dihapus');
});

// ─── District CRUD ────────────────────────────────────────────────────────────

export const createDistrict = asyncHandler(async (req, res) => {
  const data = await svc.createDistrict(req.body);
  sendSuccess(res, data, 'Kecamatan berhasil ditambahkan', 201);
});

export const updateDistrict = asyncHandler(async (req, res) => {
  const data = await svc.updateDistrict(req.params.id, req.body);
  sendSuccess(res, data, 'Kecamatan berhasil diperbarui');
});

export const deleteDistrict = asyncHandler(async (req, res) => {
  await svc.deleteDistrict(req.params.id);
  sendSuccess(res, null, 'Kecamatan berhasil dihapus');
});

// ─── Village CRUD ─────────────────────────────────────────────────────────────

export const createVillage = asyncHandler(async (req, res) => {
  const data = await svc.createVillage(req.body);
  sendSuccess(res, data, 'Desa/kelurahan berhasil ditambahkan', 201);
});

export const updateVillage = asyncHandler(async (req, res) => {
  const data = await svc.updateVillage(req.params.id, req.body);
  sendSuccess(res, data, 'Desa/kelurahan berhasil diperbarui');
});

export const deleteVillage = asyncHandler(async (req, res) => {
  await svc.deleteVillage(req.params.id);
  sendSuccess(res, null, 'Desa/kelurahan berhasil dihapus');
});
