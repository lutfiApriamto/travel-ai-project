import Type    from '../../models/type.model.js';
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
    const err = new Error('Nama tipe tidak valid untuk dijadikan slug');
    err.statusCode = 400;
    throw err;
  }

  let slug    = base;
  let counter = 1;

  while (true) {
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await Type.exists(filter);
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
  return Type.find(filter).sort({ name: 1 }).lean();
};

export const getById = async (id) => {
  const type = await Type.findById(id).lean();
  if (!type) {
    const err = new Error('Tipe tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return type;
};

export const getBySlug = async (slug) => {
  const type = await Type.findOne({ slug, status: 'active' }).lean();
  if (!type) {
    const err = new Error('Tipe tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  return type;
};

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const create = async (body) => {
  const slug = await generateUniqueSlug(body.name);
  return Type.create({ ...body, slug });
};

export const update = async (id, body) => {
  const type = await Type.findById(id);
  if (!type) {
    const err = new Error('Tipe tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (body.name && body.name !== type.name) {
    body.slug = await generateUniqueSlug(body.name, id);
  }

  Object.assign(type, body);
  return type.save();
};

export const remove = async (id) => {
  const type = await Type.findById(id);
  if (!type) {
    const err = new Error('Tipe tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  // Lepas referensi dari semua produk yang menggunakan tipe ini
  await Product.updateMany({ types: id }, { $pull: { types: id } });

  await type.deleteOne();
};
