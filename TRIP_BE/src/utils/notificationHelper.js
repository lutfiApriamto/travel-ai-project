import Notification from '../models/notification.model.js';

const ACTIVITY_TYPES = new Set([
  'order_confirmed',
  'ticket_generated',
  'order_cancelled',
  'refund_approved',
  'refund_rejected',
]);

const deriveCategory = (type) => (ACTIVITY_TYPES.has(type) ? 'activity' : 'announcement');

// Buat notifikasi in-app. Dipanggil dari service layer setelah event penting.
export const createNotification = async ({ userId, title, message, type, relatedId = null }) => {
  await Notification.create({
    userId,
    title,
    message,
    type,
    category: deriveCategory(type),
    relatedId,
  });
};
