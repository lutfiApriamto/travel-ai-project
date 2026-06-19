import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },

    slug: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },

    // Warna badge di frontend (hex color), misal: "#FF5733"
    color: {
      type:    String,
      default: null,
    },

    status: {
      type:    String,
      enum:    ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Tag', tagSchema);
