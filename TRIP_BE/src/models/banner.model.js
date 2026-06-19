import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type:     String,
      required: true,
      trim:     true,
    },

    // URL gambar banner dari Supabase Storage
    image: {
      type:     String,
      required: true,
    },

    // URL tujuan saat banner diklik (opsional, misal ke halaman produk tertentu)
    link: {
      type:    String,
      default: null,
    },

    // urutan tampil di beranda (ascending) — semakin kecil semakin duluan
    order: {
      type:    Number,
      default: 0,
    },

    isActive: {
      type:    Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Banner', bannerSchema);
