import asyncHandler          from '../../utils/asyncHandler.js';
import { sendSuccess }       from '../../utils/apiResponse.js';
import * as svc              from './notification.service.js';

export const getMyNotifications = asyncHandler(async (req, res) => {
  const { notifications, nextCursor, hasMore } = await svc.getMyNotifications(req.user.id, req.query);
  sendSuccess(res, { notifications, nextCursor, hasMore }, 'Notifikasi berhasil diambil');
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const data = await svc.getUnreadCount(req.user.id);
  sendSuccess(res, data, 'Jumlah notifikasi belum dibaca');
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await svc.markAsRead(req.user.id, req.params.id);
  sendSuccess(res, notification, 'Notifikasi ditandai sudah dibaca');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const data = await svc.markAllAsRead(req.user.id);
  sendSuccess(res, data, 'Semua notifikasi ditandai sudah dibaca');
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await svc.deleteNotification(req.user.id, req.params.id);
  sendSuccess(res, null, 'Notifikasi berhasil dihapus');
});

export const broadcast = asyncHandler(async (req, res) => {
  const data = await svc.broadcast(req.body);
  sendSuccess(res, data, `Broadcast berhasil dikirim ke ${data.sentTo} user`, 201);
});
