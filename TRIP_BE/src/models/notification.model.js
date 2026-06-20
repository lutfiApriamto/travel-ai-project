import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    title: {
      type:     String,
      required: true,
      trim:     true,
    },

    message: {
      type:     String,
      required: true,
      trim:     true,
    },

    // tipe notifikasi — menentukan ikon dan warna di frontend
    type: {
      type:     String,
      enum:     [
        'order_confirmed',
        'ticket_generated',
        'order_cancelled',
        'refund_approved',
        'refund_rejected',
        'product_cancelled',
        'broadcast',
      ],
      required: true,
    },

    // kelompok notifikasi — untuk filter tab di frontend
    category: {
      type:     String,
      enum:     ['activity', 'announcement'],
      required: true,
    },

    // ID order / refund / ticket — untuk tombol "Lihat Detail" di frontend
    relatedId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },

    isRead: {
      type:    Boolean,
      default: false,
    },

    readAt: {
      type:    Date,
      default: null,
    },

    // soft delete — user hapus notifikasi tapi data tetap tersimpan
    isDeleted: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// index utama: query notifikasi per user sorted terbaru (cursor-based)
notificationSchema.index({ userId: 1, _id: -1 });
// index untuk filter category + isRead
notificationSchema.index({ userId: 1, category: 1, _id: -1 });

export default mongoose.model('Notification', notificationSchema);
