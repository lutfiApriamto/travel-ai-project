import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './type.service.js';

export const getAll = asyncHandler(async (req, res) => {
  const data = await svc.getAll(req.user, req.query.search);
  sendSuccess(res, data, 'Data tipe berhasil diambil');
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getById(req.params.id);
  sendSuccess(res, data, 'Detail tipe berhasil diambil');
});

export const getBySlug = asyncHandler(async (req, res) => {
  const data = await svc.getBySlug(req.params.slug);
  sendSuccess(res, data, 'Detail tipe berhasil diambil');
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.create(req.body);
  sendSuccess(res, data, 'Tipe berhasil dibuat', 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  sendSuccess(res, data, 'Tipe berhasil diperbarui');
});

export const remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  sendSuccess(res, null, 'Tipe berhasil dihapus');
});
