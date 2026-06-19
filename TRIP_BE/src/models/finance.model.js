import mongoose from 'mongoose';

const financeSchema = new mongoose.Schema(
  {
    // income = uang masuk, outcome = uang keluar
    type: {
      type:     String,
      enum:     ['income', 'outcome'],
      required: true,
    },

    // kategori transaksi:
    // order      = pemasukan dari pembayaran order
    // refund     = pengeluaran karena refund diapprove
    // withdrawal = admin melakukan penarikan saldo (dummy)
    category: {
      type:     String,
      enum:     ['order', 'refund', 'withdrawal'],
      required: true,
    },

    amount: {
      type:     Number,
      required: true,
      min:      0,
    },

    description: {
      type:     String,
      required: true,
      trim:     true,
    },

    // referensi ke Order atau Refund yang memicu transaksi ini (opsional)
    relatedId: {
      type:    mongoose.Schema.Types.ObjectId,
      default: null,
    },

    // nama model dari relatedId untuk keperluan populate dynamic
    relatedModel: {
      type:    String,
      enum:    ['Order', 'Refund', null],
      default: null,
    },

    // saldo platform setelah transaksi ini terjadi
    // disimpan untuk audit trail dan mempermudah tampilan running balance
    balanceAfter: {
      type:     Number,
      required: true,
    },

    // admin yang melakukan withdrawal (hanya terisi jika category === 'withdrawal')
    processedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Finance', financeSchema);
