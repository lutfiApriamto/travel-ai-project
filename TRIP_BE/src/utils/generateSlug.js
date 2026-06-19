import Product from '../models/product.model.js';

const toBaseSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

export const generateUniqueSlug = async (name) => {
  const base = toBaseSlug(name);
  if (!base) throw new Error('Nama produk tidak valid untuk dijadikan slug');

  let slug    = base;
  let counter = 1;

  while (await Product.exists({ slug })) {
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
};
