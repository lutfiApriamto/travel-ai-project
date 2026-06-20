import Wishlist from '../../models/wishlist.model.js';
import Product  from '../../models/product.model.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

// Field minimal produk yang ditampilkan di halaman wishlist
const PRODUCT_FIELDS = 'name slug thumbnail price status categories types tags';

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getWishlist = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  // Ambil semua productId yang ada di wishlist user
  const wishlistItems = await Wishlist.find({ userId }).select('productId').lean();
  const productIds    = wishlistItems.map((w) => w.productId);

  if (productIds.length === 0) {
    return { products: [], meta: buildPaginationMeta(0, page, limit) };
  }

  // Filter hanya di antara produk yang sudah di-wishlist
  const filter = { _id: { $in: productIds } };

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filter.$or = [
      { name:             regex },
      { shortDescription: regex },
      { destinations:     regex },
    ];
  }

  if (query.category)    filter.categories = query.category;
  if (query.type)        filter.types      = query.type;
  if (query.tag)         filter.tags       = query.tag;
  if (query.destination) filter.destinations = { $regex: query.destination, $options: 'i' };

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .select(PRODUCT_FIELDS)
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

export const checkWishlist = async (userId, productId) => {
  const exists = await Wishlist.exists({ userId, productId });
  return { isWishlisted: !!exists };
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const addToWishlist = async (userId, productId) => {
  const product = await Product.exists({ _id: productId });
  if (!product) {
    const err = new Error('Produk tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  // Idempotent — tidak error jika sudah ada di wishlist
  const existing = await Wishlist.exists({ userId, productId });
  if (existing) return;

  await Wishlist.create({ userId, productId });
};

export const removeFromWishlist = async (userId, productId) => {
  const result = await Wishlist.findOneAndDelete({ userId, productId });
  if (!result) {
    const err = new Error('Produk tidak ada di wishlist');
    err.statusCode = 404;
    throw err;
  }
};
