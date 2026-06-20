import Order   from '../../models/order.model.js';
import Product from '../../models/product.model.js';
import Cart    from '../../models/cart.model.js';
import { generateOrderCode }                       from '../../utils/generateOrderCode.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getOrders = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  // User hanya melihat ordernya sendiri, admin bisa filter by userId
  if (user.role !== 'admin') {
    filter.userId = user._id;
  } else if (query.userId) {
    filter.userId = query.userId;
  }

  if (query.productId) filter.productId = query.productId;
  if (query.status)    filter.status    = query.status;

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filter.$or = [
      { 'productSnapshot.name': regex },
      { orderCode:              regex },
    ];
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate)   filter.createdAt.$lte = new Date(query.endDate);
  }

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('productId', 'name slug thumbnail status')
      .populate('userId',    'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return { orders, meta: buildPaginationMeta(total, page, limit) };
};

export const getOrderById = async (id, user) => {
  const order = await Order.findById(id)
    .populate('productId', 'name slug thumbnail status itinerary includes excludes')
    .populate('userId',    'name email phone')
    .lean();

  if (!order) {
    const err = new Error('Order tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== 'admin' && order.userId._id.toString() !== user._id.toString()) {
    const err = new Error('Anda tidak memiliki akses ke order ini');
    err.statusCode = 403;
    throw err;
  }

  return order;
};

// ─── Checkout ─────────────────────────────────────────────────────────────────

export const checkout = async (userId, { productIds }) => {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || cart.items.length === 0) {
    const err = new Error('Keranjang kosong');
    err.statusCode = 400;
    throw err;
  }

  const cartItemMap = new Map(cart.items.map((i) => [i.productId.toString(), i]));

  // Validasi SEMUA item dulu sebelum buat order apapun
  const orderData = [];

  for (const productId of productIds) {
    const cartItem = cartItemMap.get(productId);
    if (!cartItem) {
      const err = new Error(`Produk tidak ditemukan di keranjang`);
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      const err = new Error(`Produk "${cartItem.productId}" tidak tersedia untuk dipesan`);
      err.statusCode = 400;
      throw err;
    }

    const remainingSlots = product.quota - product.bookedSlots;
    if (cartItem.participants > remainingSlots) {
      const err = new Error(`Slot tidak cukup untuk produk "${product.name}". Sisa slot: ${remainingSlots}`);
      err.statusCode = 400;
      throw err;
    }

    orderData.push({ cartItem, product });
  }

  // Buat semua order setelah semua validasi lolos
  const createdOrders = await Promise.all(
    orderData.map(({ cartItem, product }) => {
      const addOnTotal = (cartItem.addOns || []).reduce((sum, a) => sum + a.price, 0);
      const totalPrice = (product.price * cartItem.participants) + addOnTotal;

      return Order.create({
        orderCode: generateOrderCode(),
        userId,
        productId: product._id,
        productSnapshot: {
          name:          product.name,
          price:         product.price,
          departureDate: product.departureDate,
          returnDate:    product.returnDate,
          duration:      product.duration,
          departureCity: product.departureCity,
          destinations:  product.destinations,
          meetingPoint:  product.meetingPoint,
          thumbnail:     product.thumbnail,
        },
        participants: cartItem.participants,
        addOns:       cartItem.addOns || [],
        note:         cartItem.note   || null,
        totalPrice,
      });
    })
  );

  // Hapus item yang sudah di-checkout dari cart
  await Cart.findOneAndUpdate(
    { userId },
    { $pull: { items: { productId: { $in: productIds } } } }
  );

  return createdOrders;
};

// ─── Cancel Pending ───────────────────────────────────────────────────────────

export const cancelOrder = async (id, userId) => {
  const order = await Order.findById(id);

  if (!order) {
    const err = new Error('Order tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (order.userId.toString() !== userId.toString()) {
    const err = new Error('Anda tidak memiliki akses ke order ini');
    err.statusCode = 403;
    throw err;
  }

  if (order.status !== 'pending_payment') {
    const err = new Error('Hanya order dengan status pending_payment yang bisa dibatalkan langsung');
    err.statusCode = 400;
    throw err;
  }

  order.status = 'cancelled';
  return order.save();
};
