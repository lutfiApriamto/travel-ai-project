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
      unique:   true, // satu order hanya punya satu tiket
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

export default mongoose.model('Ticket', ticketSchema);
