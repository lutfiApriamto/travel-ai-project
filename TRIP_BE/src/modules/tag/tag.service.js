import Tag     from '../../models/tag.model.js';
import Product from '../../models/product.model.js';

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
    const err = new Error('Nama tag tidak valid untuk dijadikan slug');
    err.statusCode = 400;
    throw err;
  }

  let slug    = base;
  let counter = 1;

  while (true) {
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await Tag.exists(filter);
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
  return Tag.find(filter).sort({ name: 1 }).lean();
};

export const getById = async (id) => {
  const tag = await Tag.findById(id).lean();
  if (!tag) {
    const err = new Error('Tag tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return tag;
};

export const getBySlug = async (slug) => {
  const tag = await Tag.findOne({ slug, status: 'active' }).lean();
  if (!tag) {
    const err = new Error('Tag tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return tag;
};

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const create = async (body) => {
  const slug = await generateUniqueSlug(body.name);
  return Tag.create({ ...body, slug });
};

export const update = async (id, body) => {
  const tag = await Tag.findById(id);
  if (!tag) {
    const err = new Error('Tag tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (body.name && body.name !== tag.name) {
    body.slug = await generateUniqueSlug(body.name, id);
  }

  Object.assign(tag, body);
  return tag.save();
};

export const remove = async (id) => {
  const tag = await Tag.findById(id);
  if (!tag) {
    const err = new Error('Tag tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  // Lepas referensi dari semua produk yang menggunakan tag ini
  await Product.updateMany({ tags: id }, { $pull: { tags: id } });

  await tag.deleteOne();
};
