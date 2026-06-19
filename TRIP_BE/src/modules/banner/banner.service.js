import Banner from '../../models/banner.model.js';
import { uploadImage, deleteFile, extractStoragePath } from '../../utils/uploadHelper.js';

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getAll = async () =>
  Banner.find({ isActive: true }).sort({ order: 1 }).lean();

export const getById = async (id) => {
  const banner = await Banner.findById(id).lean();
  if (!banner) {
    const err = new Error('Banner tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return banner;
};

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const create = async (body, file) => {
  if (!file) {
    const err = new Error('Gambar banner wajib diupload');
    err.statusCode = 400;
    throw err;
  }

  const filename = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const image    = await uploadImage(file.buffer, filename);

  return Banner.create({ ...body, image });
};

export const update = async (id, body, file) => {
  const banner = await Banner.findById(id);
  if (!banner) {
    const err = new Error('Banner tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (file) {
    const oldPath = extractStoragePath(banner.image);
    if (oldPath) await deleteFile(oldPath).catch(() => {});

    const filename = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
    body.image     = await uploadImage(file.buffer, filename);
  }

  Object.assign(banner, body);
  return banner.save();
};

export const remove = async (id) => {
  const banner = await Banner.findById(id);
  if (!banner) {
    const err = new Error('Banner tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  const storagePath = extractStoragePath(banner.image);
  if (storagePath) await deleteFile(storagePath).catch(() => {});

  await banner.deleteOne();
};
