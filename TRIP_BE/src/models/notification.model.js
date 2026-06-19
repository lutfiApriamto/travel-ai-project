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
      enum:     ['order_confirmed', 'refund_approved', 'refund_rejected', 'product_cancelled'],
      required: true,
    },

    // ID order atau refund — untuk tombol "Lihat Detail" di frontend
    relatedId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },

    isRead: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// index untuk mempercepat query notifikasi per user (sorted terbaru)
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
