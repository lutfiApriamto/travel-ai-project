import bcrypt from 'bcrypt';
import User   from '../../models/user.model.js';
import { deleteFile, extractStoragePath }          from '../../utils/uploadHelper.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';
import { sendMail }                                from '../../config/mailer.js';
import { passwordChangedTemplate }                 from '../../templates/passwordChanged.template.js';

const SALT_ROUNDS = 12;
const SAFE_FIELDS = '-password -refreshToken -resetPasswordToken -resetPasswordExpiry';

// ─── User — Profil Sendiri ────────────────────────────────────────────────────

export const getMe = async (userId) =>
  User.findById(userId).select(SAFE_FIELDS).lean();

export const updateMe = async (userId, body) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  // Hapus avatar lama dari Supabase jika URL diganti atau di-set null
  if ('avatar' in body && user.avatar && body.avatar !== user.avatar) {
    const oldPath = extractStoragePath(user.avatar);
    if (oldPath) await deleteFile(oldPath).catch(() => {});
  }

  Object.assign(user, body);
  await user.save();

  const { password, refreshToken, resetPasswordToken, resetPasswordExpiry, __v, ...safe } = user.toObject();
  return safe;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    const err = new Error('Password saat ini tidak sesuai');
    err.statusCode = 400;
    throw err;
  }

  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  const { subject, text, html } = passwordChangedTemplate({ name: user.name });
  await sendMail({ to: user.email, subject, text, html }).catch(() => {});
};

// ─── Admin — Manajemen User ───────────────────────────────────────────────────

export const getAllUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  if (query.status === 'active')    filter.isActive = true;
  if (query.status === 'suspended') filter.isActive = false;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(SAFE_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, meta: buildPaginationMeta(total, page, limit) };
};

export const getUserById = async (id) => {
  const user = await User.findById(id).select(SAFE_FIELDS).lean();
  if (!user) {
    const err = new Error('User tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return user;
};

export const toggleSuspend = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const err = new Error('User tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'admin') {
    const err = new Error('Akun admin tidak dapat di-suspend');
    err.statusCode = 403;
    throw err;
  }

  user.isActive = !user.isActive;
  await user.save();

  return { isActive: user.isActive };
};
