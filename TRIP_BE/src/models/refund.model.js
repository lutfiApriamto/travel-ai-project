import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    orderId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Order',
      required: true,
      unique:   true, // satu order hanya bisa punya satu pengajuan refund
    },

    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // alasan pembatalan yang ditulis user
    reason: {
      type:     String,
      required: true,
      trim:     true,
    },

    // jumlah uang yang dikembalikan (diisi admin saat approve)
    refundAmount: {
      type:    Number,
      default: null,
      min:     0,
    },

    // persentase refund sesuai kebijakan H- (diisi admin saat approve)
    refundPercentage: {
      type:    Number,
      default: null,
      min:     0,
      max:     100,
    },

    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected'],
      default: 'pending',
    },

    // catatan dari admin (alasan reject, atau keterangan tambahan)
    adminNote: {
      type:    String,
      default: null,
      trim:    true,
    },

    // admin yang memproses pengajuan ini
    processedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },

    // waktu admin approve atau reject
    processedAt: {
      type:    Date,
      default: null,
    },

    // key refund dari Midtrans untuk tracking (diisi setelah refund diproses)
    midtransRefundKey: {
      type:    String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Refund', refundSchema);
