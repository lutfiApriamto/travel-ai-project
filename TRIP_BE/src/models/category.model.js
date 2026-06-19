import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
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

    image: {
      type:    String,
      default: null,
    },

    status: {
      type:    String,
      enum:    ['active', 'inactive'],
      default: 'active',
    },

    sortOrder: {
      type:    Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

categorySchema.index({ status: 1, sortOrder: 1 });

export default mongoose.model('Category', categorySchema);
