import mongoose from 'mongoose';

const districtSchema = new mongoose.Schema(
  {
    // kode BPS kecamatan (7 digit), contoh: "1101010"
    id: {
      type:     String,
      required: true,
      unique:   true,
    },

    // kode kabupaten/kota induk (4 digit)
    regency_id: {
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

districtSchema.index({ regency_id: 1 });

export default mongoose.model('District', districtSchema);
