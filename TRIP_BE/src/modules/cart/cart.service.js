import Cart    from '../../models/cart.model.js';
import Product from '../../models/product.model.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

const PRODUCT_FIELDS = 'name slug thumbnail price status quota bookedSlots addOns departureDate returnDate duration departureCity';

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Validasi addOn yang dipilih user ada di product.addOns, price diambil dari DB
const resolveAddOns = (selected = [], productAddOns = []) =>
  selected.map(({ name }) => {
    const found = productAddOns.find((a) => a.name === name);
    if (!found) {
      const err = new Error(`Add-on "${name}" tidak tersedia untuk produk ini`);
      err.statusCode = 400;
      throw err;
    }
    return { name: found.name, price: found.price };
  });

const validateProductForOrder = (product, participants) => {
  if (!product || product.status !== 'active') {
    const err = new Error('Produk tidak tersedia untuk dipesan');
    err.statusCode = 400;
    throw err;
  }
  const remainingSlots = product.quota - product.bookedSlots;
  if (participants > remainingSlots) {
    const err = new Error(`Slot tidak cukup. Sisa slot: ${remainingSlots}`);
    err.statusCode = 400;
    throw err;
  }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getCart = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || cart.items.length === 0) {
    return { items: [], meta: buildPaginationMeta(0, page, limit) };
  }

  const productIds = cart.items.map((item) => item.productId);

  // Filter hanya di antara produk yang ada di cart user
  const filter = { _id: { $in: productIds } };

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filter.$or = [
      { name:             regex },
      { shortDescription: regex },
      { destinations:     regex },
    ];
  }

  if (query.category)    filter.categories   = query.category;
  if (query.type)        filter.types        = query.type;
  if (query.tag)         filter.tags         = query.tag;
  if (query.destination) filter.destinations = { $regex: query.destination, $options: 'i' };

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }

  const [products, total] = await Promise.all([
    Product.find(filter).select(PRODUCT_FIELDS).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const items = cart.items
    .filter((item) => productMap.has(item.productId.toString()))
    .map((item) => {
      const product        = productMap.get(item.productId.toString());
      const remainingSlots = product.quota - product.bookedSlots;
      return {
        productId:    item.productId,
        participants: item.participants,
        addOns:       item.addOns,
        note:         item.note,
        product,
        isAvailable: product.status === 'active' && remainingSlots >= item.participants,
      };
    });

  return { items, meta: buildPaginationMeta(total, page, limit) };
};

// ─── Write ────────────────────────────────────────────────────────────────────

export const addItem = async (userId, { productId, participants, addOns = [], note }) => {
  const product = await Product.findById(productId);
  validateProductForOrder(product, participants);

  const resolvedAddOns = resolveAddOns(addOns, product.addOns);

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    return Cart.create({ userId, items: [{ productId, participants, addOns: resolvedAddOns, note }] });
  }

  const existingIdx = cart.items.findIndex((i) => i.productId.toString() === productId.toString());

  if (existingIdx !== -1) {
    // Produk sudah ada di cart → update
    cart.items[existingIdx].participants = participants;
    cart.items[existingIdx].addOns       = resolvedAddOns;
    if (note !== undefined) cart.items[existingIdx].note = note;
  } else {
    cart.items.push({ productId, participants, addOns: resolvedAddOns, note });
  }

  return cart.save();
};

export const updateItem = async (userId, productId, body) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    const err = new Error('Keranjang tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  const item = cart.items.find((i) => i.productId.toString() === productId.toString());
  if (!item) {
    const err = new Error('Produk tidak ada di keranjang');
    err.statusCode = 404;
    throw err;
  }

  const { participants, addOns, note } = body;

  // Validasi produk hanya jika participants atau addOns berubah
  if (participants !== undefined || addOns !== undefined) {
    const product = await Product.findById(productId);
    validateProductForOrder(product, participants ?? item.participants);

    if (addOns !== undefined) {
      item.addOns = resolveAddOns(addOns, product.addOns);
    }
  }

  if (participants !== undefined) item.participants = participants;
  if (note !== undefined)         item.note         = note;

  return cart.save();
};

export const removeItem = async (userId, productId) => {
  const cart = await Cart.findOne({ userId });
  if (!cart) {
    const err = new Error('Keranjang tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  const before = cart.items.length;
  cart.items   = cart.items.filter((i) => i.productId.toString() !== productId.toString());

  if (cart.items.length === before) {
    const err = new Error('Produk tidak ada di keranjang');
    err.statusCode = 404;
    throw err;
  }

  return cart.save();
};

export const clearCart = async (userId) => {
  await Cart.findOneAndUpdate({ userId }, { items: [] });
};
