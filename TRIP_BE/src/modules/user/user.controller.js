import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './user.service.js';

export const getMe = asyncHandler(async (req, res) => {
  const data = await svc.getMe(req.user._id);
  sendSuccess(res, data, 'Profil berhasil diambil');
});

export const updateMe = asyncHandler(async (req, res) => {
  const data = await svc.updateMe(req.user._id, req.body);
  sendSuccess(res, data, 'Profil berhasil diperbarui');
});

export const uploadMyAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    const err = new Error('File gambar wajib dipilih');
    err.statusCode = 400;
    throw err;
  }
  const url = await svc.uploadAvatar(req.user._id, req.file.buffer);
  sendSuccess(res, url, 'Avatar berhasil diupload', 201);
});

export const changePassword = asyncHandler(async (req, res) => {
  await svc.changePassword(req.user._id, req.body);
  sendSuccess(res, null, 'Password berhasil diubah');
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await svc.getAllUsers(req.query);
  sendSuccess(res, users, 'Data user berhasil diambil', 200, meta);
});

export const getUserById = asyncHandler(async (req, res) => {
  const data = await svc.getUserById(req.params.id);
  sendSuccess(res, data, 'Detail user berhasil diambil');
});

export const toggleSuspend = asyncHandler(async (req, res) => {
  const data = await svc.toggleSuspend(req.params.id);
  const msg  = data.isActive ? 'User berhasil diaktifkan' : 'User berhasil di-suspend';
  sendSuccess(res, data, msg);
});
