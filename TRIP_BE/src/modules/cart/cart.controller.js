import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './cart.service.js';

export const getCart = asyncHandler(async (req, res) => {
  const { items, meta } = await svc.getCart(req.user._id, req.query);
  sendSuccess(res, items, 'Keranjang berhasil diambil', 200, meta);
});

export const addItem = asyncHandler(async (req, res) => {
  await svc.addItem(req.user._id, req.body);
  sendSuccess(res, null, 'Item berhasil ditambahkan ke keranjang', 201);
});

export const updateItem = asyncHandler(async (req, res) => {
  await svc.updateItem(req.user._id, req.params.productId, req.body);
  sendSuccess(res, null, 'Item berhasil diperbarui');
});

export const removeItem = asyncHandler(async (req, res) => {
  await svc.removeItem(req.user._id, req.params.productId);
  sendSuccess(res, null, 'Item berhasil dihapus dari keranjang');
});

export const clearCart = asyncHandler(async (req, res) => {
  await svc.clearCart(req.user._id);
  sendSuccess(res, null, 'Keranjang berhasil dikosongkan');
});
