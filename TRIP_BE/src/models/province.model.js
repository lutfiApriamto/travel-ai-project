import mongoose from 'mongoose';

const provinceSchema = new mongoose.Schema(
  {
    // kode BPS provinsi (2 digit), disimpan sebagai string
    // contoh: "11" untuk Aceh, "32" untuk Jawa Barat
    id: {
      type:     String,
      required: true,
      unique:   true,
    },

    name: {
      type:     String,
      required: true,
      trim:     true,
    },
  },
  {
    timestamps: false, // data referensi statis, tidak butuh timestamps
  }
);

export default mongoose.model('Province', provinceSchema);
