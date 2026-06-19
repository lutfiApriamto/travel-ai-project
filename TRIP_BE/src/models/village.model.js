import mongoose from 'mongoose';

const villageSchema = new mongoose.Schema(
  {
    // kode BPS desa/kelurahan (10 digit), contoh: "1101010001"
    id: {
      type:     String,
      required: true,
      unique:   true,
    },

    // kode kecamatan induk (7 digit)
    district_id: {
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

villageSchema.index({ district_id: 1 });

export default mongoose.model('Village', villageSchema);
