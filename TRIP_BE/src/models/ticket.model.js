import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    // kode tiket unik yang ditampilkan ke user, format: TRIP-XXXX-XXXX
    ticketCode: {
      type:     String,
      required: true,
      unique:   true,
    },

    orderId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Order',
      required: true,
      // tidak unique — satu order bisa punya beberapa tiket (satu per penumpang)
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

    // copy snapshot dari order — agar tiket tetap akurat meski produk/order diubah
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

    participants: {
      type: Number,
    },

    totalPrice: {
      type: Number,
    },

    // data penumpang pemilik tiket ini (satu tiket = satu penumpang)
    passenger: {
      nik:   { type: String, default: null },
      name:  { type: String, default: null },
      age:   { type: Number, default: null },
      email: { type: String, default: null },
    },

    // false jika order di-refund atau produk di-cancelled
    isValid: {
      type:    Boolean,
      default: true,
    },

    // waktu tiket diinvalidasi (refund/cancel)
    invalidatedAt: {
      type:    Date,
      default: null,
    },

    // true setelah admin scan QR dan lakukan check-in
    checkedIn: {
      type:    Boolean,
      default: false,
    },

    // waktu check-in dilakukan
    checkedInAt: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index non-unique untuk query tiket per order (satu order punya banyak tiket).
// PENTING: index unik lama `orderId_1` harus di-drop dari DB (jalankan
// seeder/fix-ticket-index.js sekali), karena mongoose tidak otomatis drop index lama.
ticketSchema.index({ orderId: 1 });

export default mongoose.model('Ticket', ticketSchema);
