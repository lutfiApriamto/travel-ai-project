import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './banner.service.js';

export const getAll = asyncHandler(async (req, res) => {
  const data = await svc.getAll();
  sendSuccess(res, data, 'Data banner berhasil diambil');
});

export const getById = asyncHandler(async (req, res) => {
  const data = await svc.getById(req.params.id);
  sendSuccess(res, data, 'Detail banner berhasil diambil');
});

export const create = asyncHandler(async (req, res) => {
  const data = await svc.create(req.body, req.file);
  sendSuccess(res, data, 'Banner berhasil dibuat', 201);
});

export const update = asyncHandler(async (req, res) => {
  const data = await svc.update(req.params.id, req.body, req.file);
  sendSuccess(res, data, 'Banner berhasil diperbarui');
});

export const remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  sendSuccess(res, null, 'Banner berhasil dihapus');
});
