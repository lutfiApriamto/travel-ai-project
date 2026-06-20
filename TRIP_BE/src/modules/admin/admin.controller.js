import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './admin.service.js';

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await svc.getDashboard(req.query);
  sendSuccess(res, data, 'Dashboard berhasil diambil');
});

export const getUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await svc.getUsers(req.query);
  sendSuccess(res, users, 'Daftar user berhasil diambil', 200, meta);
});

export const getUserDetail = asyncHandler(async (req, res) => {
  const data = await svc.getUserDetail(req.params.id);
  sendSuccess(res, data, 'Detail user berhasil diambil');
});

export const toggleSuspend = asyncHandler(async (req, res) => {
  const data = await svc.toggleSuspend(req.params.id);
  sendSuccess(res, data, data.message);
});
