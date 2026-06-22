import mongoose from 'mongoose';

const orderAddOnSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Data penumpang yang diisi saat checkout
const orderPassengerSchema = new mongoose.Schema(
  {
    nik:   { type: String, required: true },
    name:  { type: String, required: true },
    age:   { type: Number, required: true },
    email: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    // kode unik yang ditampilkan ke user, format: ORD-20260619-XXXX
    orderCode: {
      type:     String,
      required: true,
      unique:   true,
    },

    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    productId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },

    // snapshot data produk pada saat order dibuat
    // disimpan agar data order tidak berubah meski admin edit produk di kemudian hari
    productSnapshot: {
      name:          { type: String },
      price:         { type: Number },
      departureDate: { type: Date },
      returnDate:    { type: Date },
      duration:      { type: String },
      departureCity: { type: String },
      destinations:  [{ type: String }],
      meetingPoint:  { type: String },
      thumbnail:     { type: String },
    },

    // jumlah peserta yang ikut
    participants: {
      type:     Number,
      required: true,
      min:      1,
    },

    // data lengkap setiap penumpang (diisi saat checkout, satu entri per peserta)
    passengers: [orderPassengerSchema],

    // add-on yang dipilih saat checkout
    addOns: [orderAddOnSchema],

    // catatan dari user
    note: {
      type:    String,
      default: null,
      trim:    true,
    },

    // total harga = (price × participants) + total addOns
    totalPrice: {
      type:     Number,
      required: true,
      min:      0,
    },

    status: {
      type:    String,
      enum:    ['pending_payment', 'paid', 'cancelled', 'refunded'],
      default: 'pending_payment',
    },

    // Midtrans snap token — dipakai frontend untuk membuka payment popup
    paymentToken: {
      type:    String,
      default: null,
    },

    // redirect URL Midtrans untuk fallback jika popup tidak bisa dibuka
    paymentUrl: {
      type:    String,
      default: null,
    },

    // order ID yang dikirim ke Midtrans (harus unik di Midtrans)
    midtransOrderId: {
      type:    String,
      default: null,
    },

    // metode pembayaran yang digunakan (diisi saat webhook sukses)
    // contoh: credit_card, bank_transfer, gopay, shopeepay, qris
    paymentMethod: {
      type:    String,
      default: null,
    },

    // waktu payment sukses dikonfirmasi via webhook Midtrans
    paidAt: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Order', orderSchema);
