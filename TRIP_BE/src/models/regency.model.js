import mongoose from 'mongoose';

const regencySchema = new mongoose.Schema(
  {
    // kode BPS kabupaten/kota (4 digit), contoh: "1101" untuk Kab. Simeulue
    id: {
      type:     String,
      required: true,
      unique:   true,
    },

    // kode provinsi induk (2 digit)
    province_id: {
      type:     String,
      required: true,
    },

    name: {
      type:     String,
      required: true,
      trim:     true,
    },
  },
  {
    timestamps: false,
  }
);

regencySchema.index({ province_id: 1 });

export default mongoose.model('Regency', regencySchema);
