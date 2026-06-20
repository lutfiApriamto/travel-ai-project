import asyncHandler         from '../../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import * as svc               from './payment.service.js';

export const createPayment = asyncHandler(async (req, res) => {
  const data = await svc.createPayment(req.params.orderId, req.user._id);
  sendSuccess(res, data, 'Token pembayaran berhasil dibuat', 201);
});

// Webhook selalu return 200 — Midtrans akan retry jika menerima non-200
export const handleWebhook = async (req, res) => {
  try {
    await svc.handleWebhook(req.body);
  } catch (err) {
    console.error('[Webhook] Error memproses notifikasi Midtrans:', err.message);
  }
  res.status(200).json({ message: 'OK' });
};

export const checkStatus = asyncHandler(async (req, res) => {
  const data = await svc.checkStatus(req.params.orderId, req.user);
  sendSuccess(res, data, 'Status pembayaran berhasil dicek');
});
