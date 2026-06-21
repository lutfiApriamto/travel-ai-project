import Category from '../../models/category.model.js';
import Product  from '../../models/product.model.js';
import { uploadImage, deleteFile, extractStoragePath } from '../../utils/uploadHelper.js';

// ─── Slug Helper ──────────────────────────────────────────────────────────────

const toBaseSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const generateUniqueSlug = async (name, excludeId = null) => {
  const base = toBaseSlug(name);
  if (!base) {
    const err = new Error('Nama kategori tidak valid untuk dijadikan slug');
    err.statusCode = 400;
    throw err;
  }

  let slug    = base;
  let counter = 1;

  while (true) {
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await Category.exists(filter);
    if (!exists) break;
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getAll = async (user, search) => {
  const filter = {};
  if (!user || user.role !== 'admin') filter.status = 'active';
  if (search) filter.name = { $regex: search, $options: 'i' };
  return Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
};

export const getById = async (id) => {
  const category = await Category.findById(id).lean();
  if (!category) {
    const err = new Error('Kategori tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return category;
};

export const getBySlug = async (slug) => {
  const category = await Category.findOne({ slug, status: 'active' }).lean();
  if (!category) {
    const err = new Error('Kategori tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return category;
};

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const create = async (body, file) => {
  const slug = await generateUniqueSlug(body.name);

  // file takes precedence; fall back to URL sent by frontend (already uploaded to Supabase)
  let image = body.image || null;
  if (file) {
    image = await uploadImage(file.buffer, `categories/${slug}-${Date.now()}.webp`);
  }

  return Category.create({ ...body, slug, image });
};

export const update = async (id, body, file) => {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error('Kategori tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (body.name && body.name !== category.name) {
    body.slug = await generateUniqueSlug(body.name, id);
  }

  if (file) {
    // New file provided → delete old from Supabase, upload new
    if (category.image) {
      const oldPath = extractStoragePath(category.image);
      if (oldPath) await deleteFile(oldPath).catch(() => {});
    }
    const slug = body.slug || category.slug;
    body.image = await uploadImage(file.buffer, `categories/${slug}-${Date.now()}.webp`);
  } else if ('image' in body) {
    // image field explicitly sent by frontend (URL string or empty = cleared)
    body.image = body.image || null;
  } else {
    // image not included in body → keep existing, remove from body to avoid overwrite
    delete body.image;
  }

  Object.assign(category, body);
  return category.save();
};

export const remove = async (id) => {
  const category = await Category.findById(id);
  if (!category) {
    const err = new Error('Kategori tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  // Lepas referensi dari semua produk yang menggunakan kategori ini
  await Product.updateMany({ categories: id }, { $pull: { categories: id } });

  if (category.image) {
    const storagePath = extractStoragePath(category.image);
    if (storagePath) await deleteFile(storagePath).catch(() => {});
  }

  await category.deleteOne();
};
