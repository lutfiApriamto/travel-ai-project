import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: true,
      trim:     true,
    },

    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    password: {
      type:     String,
      required: true,
    },

    phone: {
      type:    String,
      default: null,
      trim:    true,
    },

    avatar: {
      type:    String,
      default: null,
    },

    role: {
      type:    String,
      enum:    ['user', 'admin'],
      default: 'user',
    },

    // false = user di-suspend/banned oleh admin, tidak bisa login
    isActive: {
      type:    Boolean,
      default: true,
    },

    // hashed SHA-256 dari refresh token — tidak pernah simpan raw token di DB
    refreshToken: {
      type:    String,
      default: null,
    },

    // hashed SHA-256 dari token reset password yang dikirim ke email
    resetPasswordToken: {
      type:    String,
      default: null,
    },

    // batas waktu token reset aktif
    resetPasswordExpiry: {
      type:    Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', userSchema);
