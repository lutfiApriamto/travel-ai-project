import Notification from '../models/notification.model.js';

// Buat notifikasi in-app. Dipanggil dari service layer setelah event penting
// (order paid, refund approved/rejected, product cancelled).
export const createNotification = async ({ userId, title, message, type, relatedId = null }) => {
  await Notification.create({ userId, title, message, type, relatedId });
};
