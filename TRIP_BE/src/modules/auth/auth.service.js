import crypto  from 'crypto';
import bcrypt  from 'bcrypt';
import User    from '../../models/user.model.js';
import { signToken }                from '../../utils/jwtHelper.js';
import { sendMail }                 from '../../config/mailer.js';
import { forgotPasswordTemplate }   from '../../templates/forgotPassword.template.js';
import { resetPasswordTemplate }    from '../../templates/resetPassword.template.js';

const SALT_ROUNDS        = 12;
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 jam

// ─── Private Helpers ─────────────────────────────────────────────────────────

const sanitizeUser = (user) => ({
  _id:    user._id,
  name:   user.name,
  email:  user.email,
  phone:  user.phone,
  avatar: user.avatar,
  role:   user.role,
});

// Generate access token (JWT 15m) + opaque refresh token (hashed SHA-256 disimpan di DB)
const createTokens = async (user) => {
  const accessToken        = signToken({ id: user._id, role: user.role }, '1h');
  const rawRefreshToken    = crypto.randomBytes(40).toString('hex');
  const hashedRefreshToken = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');

  await User.findByIdAndUpdate(user._id, { refreshToken: hashedRefreshToken });

  return { accessToken, rawRefreshToken };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const registerUser = async ({ name, email, password, phone }) => {
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) {
    const err = new Error('Email sudah terdaftar');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user   = await User.create({ name, email: email.toLowerCase(), password: hashed, phone });
  const { accessToken, rawRefreshToken } = await createTokens(user);

  return { accessToken, rawRefreshToken, user: sanitizeUser(user) };
};

// Inisialisasi akun admin — dipanggil sekali via endpoint POST /api/auth/admin/register.
// Menggunakan EMAIL_ADMIN + EMAIL_ADMIN_PASS dari environment.
export const registerAdmin = async () => {
  const exists = await User.exists({ role: 'admin' });
  if (exists) {
    const err = new Error('Admin sudah terdaftar. Endpoint ini hanya bisa dipakai sekali.');
    err.statusCode = 409;
    throw err;
  }

  const { EMAIL_ADMIN, EMAIL_ADMIN_PASS } = process.env;
  if (!EMAIL_ADMIN || !EMAIL_ADMIN_PASS) {
    const err = new Error('Kredensial admin belum dikonfigurasi di server');
    err.statusCode = 500;
    throw err;
  }

  const hashed = await bcrypt.hash(EMAIL_ADMIN_PASS, SALT_ROUNDS);
  const admin  = await User.create({
    name:     'Admin',
    email:    EMAIL_ADMIN.toLowerCase(),
    password: hashed,
    role:     'admin',
  });

  return { adminId: admin._id, email: admin.email };
};

export const login = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Pesan error sama untuk email tidak ditemukan DAN password salah — cegah user enumeration
  const invalidErr = new Error('Email atau password salah');
  invalidErr.statusCode = 401;

  if (!user) throw invalidErr;

  if (!user.isActive) {
    const err = new Error('Akun Anda telah dinonaktifkan. Hubungi admin.');
    err.statusCode = 403;
    throw err;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw invalidErr;

  const { accessToken, rawRefreshToken } = await createTokens(user);
  return { accessToken, rawRefreshToken, user: sanitizeUser(user) };
};

export const refreshAccessToken = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    const err = new Error('Sesi tidak ditemukan, silakan login kembali');
    err.statusCode = 401;
    throw err;
  }

  const hashed = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  const user   = await User.findOne({ refreshToken: hashed });

  if (!user) {
    const err = new Error('Sesi tidak valid, silakan login kembali');
    err.statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Akun Anda telah dinonaktifkan. Hubungi admin.');
    err.statusCode = 403;
    throw err;
  }

  // Token rotation: generate refresh token baru dan invalidasi yang lama seketika
  const newRaw    = crypto.randomBytes(40).toString('hex');
  const newHashed = crypto.createHash('sha256').update(newRaw).digest('hex');
  user.refreshToken = newHashed;
  await user.save();

  const accessToken = signToken({ id: user._id, role: user.role }, '1h');
  return { accessToken, rawRefreshToken: newRaw, user: sanitizeUser(user) };
};

export const logout = async (rawRefreshToken) => {
  if (!rawRefreshToken) return;
  const hashed = crypto.createHash('sha256').update(rawRefreshToken).digest('hex');
  await User.findOneAndUpdate({ refreshToken: hashed }, { refreshToken: null });
};

export const forgotPassword = async ({ email }) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  // Selalu return sukses meski email tidak ditemukan — cegah user enumeration attack
  if (!user) return;

  const rawToken    = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.resetPasswordToken  = hashedToken;
  user.resetPasswordExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY);
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;
  const { subject, html, text } = forgotPasswordTemplate({ name: user.name, resetUrl });
  await sendMail({ to: user.email, subject, html, text });
};

// Verifikasi token + email sebelum user isi password baru.
// Return { name } jika valid — dipakai frontend untuk sapa user by name.
export const verifyResetToken = async ({ token, email }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    const err = new Error('Link reset password tidak valid atau sudah kedaluwarsa');
    err.statusCode = 400;
    throw err;
  }

  if (user.email !== email.toLowerCase()) {
    const err = new Error('Email tidak cocok dengan link reset password ini');
    err.statusCode = 400;
    throw err;
  }

  return { name: user.name };
};

export const resetPassword = async ({ token, newPassword }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken:  hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    const err = new Error('Token tidak valid atau sudah kedaluwarsa');
    err.statusCode = 400;
    throw err;
  }

  user.password            = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.resetPasswordToken  = null;
  user.resetPasswordExpiry = null;
  await user.save();

  const { subject, html, text } = resetPasswordTemplate({ name: user.name });
  await sendMail({ to: user.email, subject, html, text });
};
