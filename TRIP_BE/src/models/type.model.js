import mongoose from 'mongoose';

const typeSchema = new mongoose.Schema(
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

    description: {
      type:    String,
      default: null,
      trim:    true,
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

export default mongoose.model('Type', typeSchema);
