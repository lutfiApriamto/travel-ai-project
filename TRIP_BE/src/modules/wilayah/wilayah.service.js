import Province from '../../models/province.model.js';
import Regency  from '../../models/regency.model.js';
import District from '../../models/district.model.js';
import Village  from '../../models/village.model.js';

const PROJECTION = { _id: 0, __v: 0 };

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getProvinces = async (search) => {
  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  return Province.find(filter, PROJECTION).sort({ name: 1 }).lean();
};

export const getRegencies = async (province_id, search) => {
  const filter = {};
  if (province_id) filter.province_id = province_id;
  if (search)      filter.name        = { $regex: search, $options: 'i' };
  return Regency.find(filter, PROJECTION).sort({ name: 1 }).lean();
};

export const getDistricts = async (regency_id, search) => {
  const filter = {};
  if (regency_id) filter.regency_id = regency_id;
  if (search)     filter.name       = { $regex: search, $options: 'i' };
  return District.find(filter, PROJECTION).sort({ name: 1 }).lean();
};

export const getVillages = async (district_id, search) => {
  // 80K+ records — wajib ada minimal satu filter untuk mencegah full scan
  if (!district_id && !search) return [];
  const filter = {};
  if (district_id) filter.district_id = district_id;
  if (search)      filter.name        = { $regex: search, $options: 'i' };
  return Village.find(filter, PROJECTION).sort({ name: 1 }).lean();
};

// ─── Province CRUD ────────────────────────────────────────────────────────────

export const createProvince = async (data) => {
  // MongoDB melempar error 11000 jika id duplikat — ditangani errorHandler
  return Province.create(data);
};

export const updateProvince = async (id, data) => {
  const updated = await Province.findOneAndUpdate({ id }, data, { new: true });
  if (!updated) {
    const err = new Error('Provinsi tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

export const deleteProvince = async (id) => {
  const deleted = await Province.findOneAndDelete({ id });
  if (!deleted) {
    const err = new Error('Provinsi tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
};

// ─── Regency CRUD ─────────────────────────────────────────────────────────────

export const createRegency = async (data) => {
  return Regency.create(data);
};

export const updateRegency = async (id, data) => {
  const updated = await Regency.findOneAndUpdate({ id }, data, { new: true });
  if (!updated) {
    const err = new Error('Kabupaten/kota tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

export const deleteRegency = async (id) => {
  const deleted = await Regency.findOneAndDelete({ id });
  if (!deleted) {
    const err = new Error('Kabupaten/kota tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
};

// ─── District CRUD ────────────────────────────────────────────────────────────

export const createDistrict = async (data) => {
  return District.create(data);
};

export const updateDistrict = async (id, data) => {
  const updated = await District.findOneAndUpdate({ id }, data, { new: true });
  if (!updated) {
    const err = new Error('Kecamatan tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

export const deleteDistrict = async (id) => {
  const deleted = await District.findOneAndDelete({ id });
  if (!deleted) {
    const err = new Error('Kecamatan tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
};

// ─── Village CRUD ─────────────────────────────────────────────────────────────

export const createVillage = async (data) => {
  return Village.create(data);
};

export const updateVillage = async (id, data) => {
  const updated = await Village.findOneAndUpdate({ id }, data, { new: true });
  if (!updated) {
    const err = new Error('Desa/kelurahan tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return updated;
};

export const deleteVillage = async (id) => {
  const deleted = await Village.findOneAndDelete({ id });
  if (!deleted) {
    const err = new Error('Desa/kelurahan tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
};
