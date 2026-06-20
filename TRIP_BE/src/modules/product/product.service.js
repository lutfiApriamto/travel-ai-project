import Product  from '../../models/product.model.js';
import Wishlist from '../../models/wishlist.model.js';
import Cart     from '../../models/cart.model.js';
import Order    from '../../models/order.model.js';
import { deleteFile, extractStoragePath }          from '../../utils/uploadHelper.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';
import { calcDuration }                            from '../../utils/dateHelper.js';
import { sendMail }                                from '../../config/mailer.js';
import { createNotification }                      from '../../utils/notificationHelper.js';
import { productCancelledTemplate }                from '../../templates/productCancelled.template.js';

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
    const err = new Error('Nama produk tidak valid untuk dijadikan slug');
    err.statusCode = 400;
    throw err;
  }

  let slug    = base;
  let counter = 1;

  while (true) {
    const filter = { slug };
    if (excludeId) filter._id = { $ne: excludeId };
    const exists = await Product.exists(filter);
    if (!exists) break;
    slug = `${base}-${counter++}`;
  }

  return slug;
};

// ─── Image Cleanup Helper ─────────────────────────────────────────────────────

const deleteImages = (urls = []) =>
  Promise.allSettled(
    urls.filter(Boolean).map((url) => {
      const path = extractStoragePath(url);
      return path ? deleteFile(path).catch(() => {}) : Promise.resolve();
    })
  );

// ─── Cancel Notification Helper ───────────────────────────────────────────────

const notifyProductCancelled = async (productId, productName) => {
  const orders = await Order.find({ productId, status: 'paid' })
    .populate('userId', 'name email')
    .lean();

  if (!orders.length) return;

  await Promise.allSettled(
    orders.map(async (order) => {
      const user = order.userId;
      if (!user) return;

      const { subject, text, html } = productCancelledTemplate({
        name:        user.name,
        productName,
        orderCode:   order.orderCode,
      });

      await sendMail({ to: user.email, subject, text, html }).catch(() => {});

      await createNotification({
        userId:    user._id,
        title:     'Paket Perjalanan Dibatalkan',
        message:   `Paket "${productName}" (pesanan ${order.orderCode}) telah dibatalkan admin. Silakan hubungi kami untuk info lebih lanjut.`,
        type:      'product_cancelled',
        relatedId: order._id,
      }).catch(() => {});
    })
  );
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getAll = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    filter.status = 'active';
  } else if (query.status) {
    filter.status = query.status;
  }

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filter.$or = [
      { name:             regex },
      { shortDescription: regex },
      { destinations:     regex },
    ];
  }

  if (query.category)      filter.categories    = query.category;
  if (query.type)          filter.types         = query.type;
  if (query.tag)           filter.tags          = query.tag;
  if (query.departureCity) filter.departureCity = { $regex: query.departureCity, $options: 'i' };
  if (query.destination)   filter.destinations  = { $regex: query.destination,   $options: 'i' };

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('categories', 'name slug')
      .populate('types',      'name slug')
      .populate('tags',       'name slug color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return { products, meta: buildPaginationMeta(total, page, limit) };
};

export const getById = async (id, user) => {
  const filter  = { _id: id };
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) filter.status = 'active';

  const product = await Product.findOneAndUpdate(
    filter,
    isAdmin ? {} : { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate('categories', 'name slug')
    .populate('types',      'name slug')
    .populate('tags',       'name slug color')
    .lean();

  if (!product) {
    const err = new Error('Produk tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  return product;
};

export const getBySlug = async (slug, user) => {
  const filter  = { slug };
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) filter.status = 'active';

  const product = await Product.findOneAndUpdate(
    filter,
    isAdmin ? {} : { $inc: { viewCount: 1 } },
    { new: true }
  )
    .populate('categories', 'name slug')
    .populate('types',      'name slug')
    .populate('tags',       'name slug color')
    .lean();

  if (!product) {
    const err = new Error('Produk tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  return product;
};

// ─── Admin CRUD ───────────────────────────────────────────────────────────────

export const create = async (body) => {
  const slug     = await generateUniqueSlug(body.name);
  const duration = calcDuration(body.departureDate, body.returnDate);
  return Product.create({ ...body, slug, duration });
};

export const update = async (id, body) => {
  const product = await Product.findById(id);
  if (!product) {
    const err = new Error('Produk tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (body.name && body.name !== product.name) {
    body.slug = await generateUniqueSlug(body.name, id);
  }

  // Hapus thumbnail lama dari Supabase jika URL berubah atau di-set null
  if ('thumbnail' in body && product.thumbnail && body.thumbnail !== product.thumbnail) {
    const oldPath = extractStoragePath(product.thumbnail);
    if (oldPath) await deleteFile(oldPath).catch(() => {});
  }

  // Hapus URL gallery yang dihapus dari Supabase
  if (body.gallery !== undefined) {
    const removed = (product.gallery || []).filter((url) => !body.gallery.includes(url));
    await deleteImages(removed);
  }

  // Recalculate duration jika salah satu tanggal berubah
  if (body.departureDate || body.returnDate) {
    body.duration = calcDuration(
      body.departureDate || product.departureDate,
      body.returnDate    || product.returnDate
    );
  }

  const prevStatus = product.status;
  Object.assign(product, body);
  const saved = await product.save();

  if (body.status === 'cancelled' && prevStatus !== 'cancelled') {
    notifyProductCancelled(saved._id, saved.name).catch(() => {});
  }

  return saved;
};

export const remove = async (id) => {
  const product = await Product.findById(id);
  if (!product) {
    const err = new Error('Produk tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  await deleteImages([product.thumbnail, ...(product.gallery || [])]);

  await Promise.all([
    Wishlist.deleteMany({ productId: id }),
    Cart.updateMany({}, { $pull: { items: { productId: id } } }),
  ]);

  await product.deleteOne();
};

export const duplicate = async (id) => {
  const source = await Product.findById(id).lean();
  if (!source) {
    const err = new Error('Produk tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  // eslint-disable-next-line no-unused-vars
  const { _id, __v, createdAt, updatedAt, slug: _slug, thumbnail, gallery, bookedSlots, soldCount, viewCount, ...rest } = source;

  const slug = await generateUniqueSlug(`${source.name} copy`);

  return Product.create({
    ...rest,
    slug,
    thumbnail:   null,
    gallery:     [],
    bookedSlots: 0,
    soldCount:   0,
    viewCount:   0,
    status:      'draft',
  });
};

export const bulkUpdateStatus = async (ids, status) => {
  // Query produk yang belum cancelled SEBELUM updateMany — setelah update tidak bisa dibedakan
  let productsToNotify = [];
  if (status === 'cancelled') {
    productsToNotify = await Product.find({
      _id:    { $in: ids },
      status: { $ne: 'cancelled' },
    }).select('_id name').lean();
  }

  const result = await Product.updateMany({ _id: { $in: ids } }, { status });

  if (productsToNotify.length) {
    Promise.allSettled(
      productsToNotify.map((p) => notifyProductCancelled(p._id, p.name))
    ).catch(() => {});
  }

  return result.modifiedCount;
};
