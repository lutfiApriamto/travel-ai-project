import mongoose   from 'mongoose';
import Notification from '../../models/notification.model.js';
import User         from '../../models/user.model.js';

// ─── List notifikasi milik user — cursor-based (infinity scroll) ──────────────

export const getMyNotifications = async (userId, query) => {
  const limit  = Math.min(50, Math.max(1, parseInt(query.limit) || 20));
  const filter = { userId, isDeleted: false };

  if (query.isRead === 'true')           filter.isRead    = true;
  if (query.isRead === 'false')          filter.isRead    = false;
  if (query.category === 'activity')     filter.category  = 'activity';
  if (query.category === 'announcement') filter.category  = 'announcement';

  if (query.search) {
    const regex    = new RegExp(query.search, 'i');
    filter.$or     = [{ title: regex }, { message: regex }];
  }

  // cursor = _id dokumen terakhir dari batch sebelumnya
  if (query.cursor && mongoose.Types.ObjectId.isValid(query.cursor)) {
    filter._id = { $lt: new mongoose.Types.ObjectId(query.cursor) };
  }

  const notifications = await Notification.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)   // ambil 1 extra untuk deteksi hasMore
    .lean();

  const hasMore    = notifications.length > limit;
  if (hasMore) notifications.pop();

  const nextCursor = hasMore ? notifications[notifications.length - 1]._id : null;

  return { notifications, nextCursor, hasMore };
};

// ─── Jumlah notifikasi belum dibaca (untuk badge UI) ─────────────────────────

export const getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({ userId, isRead: false, isDeleted: false });
  return { unreadCount: count };
};

// ─── Tandai satu notifikasi sebagai sudah dibaca ──────────────────────────────

export const markAsRead = async (userId, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    const err = new Error('ID notifikasi tidak valid');
    err.statusCode = 400;
    throw err;
  }

  const notification = await Notification.findOne({ _id: notificationId, userId, isDeleted: false });
  if (!notification) {
    const err = new Error('Notifikasi tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (notification.isRead) return notification;

  notification.isRead = true;
  notification.readAt  = new Date();
  await notification.save();
  return notification;
};

// ─── Tandai semua notifikasi sebagai sudah dibaca ────────────────────────────

export const markAllAsRead = async (userId) => {
  const now    = new Date();
  const result = await Notification.updateMany(
    { userId, isRead: false, isDeleted: false },
    { $set: { isRead: true, readAt: now } },
  );
  return { updatedCount: result.modifiedCount };
};

// ─── Soft delete satu notifikasi ─────────────────────────────────────────────

export const deleteNotification = async (userId, notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    const err = new Error('ID notifikasi tidak valid');
    err.statusCode = 400;
    throw err;
  }

  const notification = await Notification.findOne({ _id: notificationId, userId, isDeleted: false });
  if (!notification) {
    const err = new Error('Notifikasi tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  notification.isDeleted = true;
  await notification.save();
};

// ─── Broadcast notifikasi dari admin ─────────────────────────────────────────

export const broadcast = async ({ title, message, targetUserIds }) => {
  let userIds;

  if (targetUserIds && targetUserIds.length > 0) {
    const validIds = targetUserIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      const err = new Error('Tidak ada targetUserIds yang valid');
      err.statusCode = 400;
      throw err;
    }
    userIds = validIds.map((id) => new mongoose.Types.ObjectId(id));
  } else {
    const users = await User.find({ role: 'user' }, '_id').lean();
    userIds     = users.map((u) => u._id);
  }

  if (userIds.length === 0) {
    const err = new Error('Tidak ada user yang menjadi target broadcast');
    err.statusCode = 400;
    throw err;
  }

  const docs = userIds.map((uid) => ({
    userId:   uid,
    title,
    message,
    type:     'broadcast',
    category: 'announcement',
    relatedId: null,
  }));

  await Notification.insertMany(docs, { ordered: false });
  return { sentTo: userIds.length };
};
