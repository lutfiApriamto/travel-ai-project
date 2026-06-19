import mongoose from 'mongoose';

// Sub-schema add-on yang dipilih user di cart
const cartAddOnSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Sub-schema setiap item di keranjang
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Product',
      required: true,
    },

    // jumlah peserta untuk produk ini
    participants: {
      type:     Number,
      required: true,
      min:      1,
    },

    // add-on opsional yang dipilih user
    addOns: [cartAddOnSchema],

    // catatan khusus dari user untuk pesanan ini
    note: {
      type:    String,
      default: null,
      trim:    true,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    // satu user hanya punya satu dokumen cart
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
    },

    items: [cartItemSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Cart', cartSchema);
