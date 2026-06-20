import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './product.service.js';

export const getAll = asyncHandler(async (req, res) => {
  const { products, meta } = await svc.getAll(req.user, req.query);
  sendSuccess(res, products, 'Data produk berhasil diambil', 200, meta);
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getById(req.params.id, req.user);
  sendSuccess(res, data, 'Detail produk berhasil diambil');
});

export const getBySlug = asyncHandler(async (req, res) => {
  const data = await svc.getBySlug(req.params.slug, req.user);
  sendSuccess(res, data, 'Detail produk berhasil diambil');
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.create(req.body);
  sendSuccess(res, data, 'Produk berhasil dibuat', 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.body);
  sendSuccess(res, data, 'Produk berhasil diperbarui');
});

export const remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  sendSuccess(res, null, 'Produk berhasil dihapus');
});

export const duplicate = asyncHandler(async (req, res) => {
  const data = await svc.duplicate(req.params.id);
  sendSuccess(res, data, 'Produk berhasil diduplikasi', 201);
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const count = await svc.bulkUpdateStatus(req.body.ids, req.body.status);
  sendSuccess(res, { modifiedCount: count }, `${count} produk berhasil diperbarui`);
});
