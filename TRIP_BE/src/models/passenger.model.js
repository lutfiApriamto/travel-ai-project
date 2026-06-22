import mongoose from 'mongoose';

const passengerSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // NIK wajib 16 digit angka
    nik: {
      type:     String,
      required: true,
      match:    [/^\d{16}$/, 'NIK harus 16 digit angka'],
      trim:     true,
    },

    name: {
      type:     String,
      required: true,
      trim:     true,
    },

    age: {
      type:     Number,
      required: true,
      min:      1,
    },

    email: {
      type:      String,
      required:  true,
      trim:      true,
      lowercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Satu user tidak bisa punya dua penumpang dengan NIK yang sama
passengerSchema.index({ userId: 1, nik: 1 }, { unique: true });

export default mongoose.model('Passenger', passengerSchema);
