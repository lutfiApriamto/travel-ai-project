import mongoose from 'mongoose';

// Sub-schema satu aturan refund berdasarkan H- keberangkatan
const refundRuleSchema = new mongoose.Schema(
  {
    // batas bawah (inklusif): minimal berapa hari sebelum berangkat
    minDaysBeforeDeparture: {
      type:     Number,
      required: true,
      min:      0,
    },

    // batas atas (inklusif): maksimal berapa hari sebelum berangkat
    // null berarti tidak ada batas atas (misal: H-30 ke atas)
    maxDaysBeforeDeparture: {
      type:    Number,
      default: null,
    },

    // persentase uang yang dikembalikan (0-100)
    refundPercentage: {
      type:     Number,
      required: true,
      min:      0,
      max:      100,
    },

    // deskripsi aturan untuk ditampilkan ke user
    // misal: "Pembatalan H-30 atau lebih: refund 100%"
    description: {
      type:     String,
      required: true,
    },
  },
  { _id: false }
);

const refundPolicySchema = new mongoose.Schema(
  {
    rules: [refundRuleSchema],

    // di bawah hari ini: tidak ada refund (misal: 2 hari sebelum berangkat)
    noRefundDays: {
      type:    Number,
      default: 2,
    },

    // admin terakhir yang mengubah kebijakan ini
    updatedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('RefundPolicy', refundPolicySchema);
