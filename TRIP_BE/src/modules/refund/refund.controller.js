import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './refund.service.js';

// ─── Policy ───────────────────────────────────────────────────────────────────

export const getPolicy = asyncHandler(async (req, res) => {
  const data = await svc.getPolicy();
  sendSuccess(res, data, 'Kebijakan refund berhasil diambil');
});

export const updatePolicy = asyncHandler(async (req, res) => {
  const data = await svc.updatePolicy(req.user._id, req.body);
  sendSuccess(res, data, 'Kebijakan refund berhasil diperbarui');
});

// ─── User ─────────────────────────────────────────────────────────────────────

export const submitRefund = asyncHandler(async (req, res) => {
  const data = await svc.submitRefund(req.user._id, req.body);
  sendSuccess(res, data, 'Pengajuan refund berhasil dikirim', 201);
});

export const getMyRefunds = asyncHandler(async (req, res) => {
  const { refunds, meta } = await svc.getMyRefunds(req.user._id, req.query);
  sendSuccess(res, refunds, 'Data refund berhasil diambil', 200, meta);
});

export const getMyRefundById = asyncHandler(async (req, res) => {
  const data = await svc.getMyRefundById(req.params.id, req.user._id);
  sendSuccess(res, data, 'Detail refund berhasil diambil');
});

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllRefunds = asyncHandler(async (req, res) => {
  const { refunds, meta } = await svc.getAllRefunds(req.query);
  sendSuccess(res, refunds, 'Data refund berhasil diambil', 200, meta);
});

export const getRefundById = asyncHandler(async (req, res) => {
  const data = await svc.getRefundById(req.params.id);
  sendSuccess(res, data, 'Detail refund berhasil diambil');
});

export const approveRefund = asyncHandler(async (req, res) => {
  const data = await svc.approveRefund(req.params.id, req.user._id);
  sendSuccess(res, data, 'Refund berhasil disetujui');
});

export const rejectRefund = asyncHandler(async (req, res) => {
  const data = await svc.rejectRefund(req.params.id, req.user._id, req.body);
  sendSuccess(res, data, 'Pengajuan refund ditolak');
});
