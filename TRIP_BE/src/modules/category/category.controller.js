import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './category.service.js';

export const getAll = asyncHandler(async (req, res) => {
  const data = await svc.getAll(req.user, req.query.search);
  sendSuccess(res, data, 'Data kategori berhasil diambil');
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getById(req.params.id);
  sendSuccess(res, data, 'Detail kategori berhasil diambil');
});

export const getBySlug = asyncHandler(async (req, res) => {
  const data = await svc.getBySlug(req.params.slug);
  sendSuccess(res, data, 'Detail kategori berhasil diambil');
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.create(req.body, req.file);
  sendSuccess(res, data, 'Kategori berhasil dibuat', 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.body, req.file);
  sendSuccess(res, data, 'Kategori berhasil diperbarui');
});

export const remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  sendSuccess(res, null, 'Kategori berhasil dihapus');
});
