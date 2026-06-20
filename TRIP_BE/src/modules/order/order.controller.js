import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './order.service.js';

export const getOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await svc.getOrders(req.user, req.query);
  sendSuccess(res, orders, 'Data order berhasil diambil', 200, meta);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const data = await svc.getOrderById(req.params.id, req.user);
  sendSuccess(res, data, 'Detail order berhasil diambil');
});

export const checkout = asyncHandler(async (req, res) => {
  const data = await svc.checkout(req.user._id, req.body);
  sendSuccess(res, data, `${data.length} order berhasil dibuat`, 201);
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const data = await svc.cancelOrder(req.params.id, req.user._id);
  sendSuccess(res, data, 'Order berhasil dibatalkan');
});
