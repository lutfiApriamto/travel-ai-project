import Order     from '../../models/order.model.js';
import Product   from '../../models/product.model.js';
import Cart      from '../../models/cart.model.js';
import Passenger from '../../models/passenger.model.js';
import { generateOrderCode }                       from '../../utils/generateOrderCode.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getOrders = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

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

// ─── Helper: auto-save passengers to user's saved list ────────────────────────

const autoSavePassengers = async (userId, passengers) => {
  await Promise.allSettled(
    passengers.map((p) =>
      Passenger.findOneAndUpdate(
        { userId, nik: p.nik },
        { name: p.name, age: p.age, email: p.email.toLowerCase() },
        { upsert: true, new: true, runValidators: true }
      ).catch(() => {}) // jangan gagalkan checkout hanya karena auto-save gagal
    )
  );
};

// ─── Checkout dari Keranjang ──────────────────────────────────────────────────

export const checkout = async (userId, { productIds, passengersMap }) => {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart || cart.items.length === 0) {
    const err = new Error('Keranjang kosong');
    err.statusCode = 400;
    throw err;
  }

  const cartItemMap = new Map(cart.items.map((i) => [i.productId.toString(), i]));

  // Validasi semua item dulu sebelum buat order
  const orderData = [];

  for (const productId of productIds) {
    const cartItem   = cartItemMap.get(productId);
    if (!cartItem) {
      const err = new Error('Produk tidak ditemukan di keranjang');
      err.statusCode = 400;
      throw err;
    }

    const product = await Product.findById(productId);
    if (!product || product.status !== 'active') {
      const err = new Error(`Produk "${productId}" tidak tersedia`);
      err.statusCode = 400;
      throw err;
    }

    const remainingSlots = product.quota - product.bookedSlots;
    if (cartItem.participants > remainingSlots) {
      const err = new Error(`Slot tidak cukup untuk "${product.name}". Sisa: ${remainingSlots}`);
      err.statusCode = 400;
      throw err;
    }

    const passengers = passengersMap[productId] ?? [];
    if (passengers.length !== cartItem.participants) {
      const err = new Error(
        `Data penumpang untuk "${product.name}" harus berjumlah ${cartItem.participants} orang`
      );
      err.statusCode = 400;
      throw err;
    }

    orderData.push({ cartItem, product, passengers });
  }

  // Buat semua order setelah semua validasi lolos
  const createdOrders = await Promise.all(
    orderData.map(({ cartItem, product, passengers }) => {
      const addOnTotal = (cartItem.addOns || []).reduce((sum, a) => sum + a.price, 0);
      const totalPrice = (product.price * cartItem.participants) + addOnTotal;

      return Order.create({
        orderCode:  generateOrderCode(),
        userId,
        productId:  product._id,
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
        passengers,
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

  // Auto-save semua penumpang ke daftar tersimpan user
  const allPassengers = orderData.flatMap((d) => d.passengers);
  await autoSavePassengers(userId, allPassengers);

  return createdOrders;
};

// ─── Express Checkout (langsung dari halaman produk, bypass cart) ─────────────

export const expressCheckout = async (userId, { productId, addOns = [], note = null, passengers }) => {
  const product = await Product.findById(productId);
  if (!product || product.status !== 'active') {
    const err = new Error('Produk tidak tersedia untuk dipesan');
    err.statusCode = 400;
    throw err;
  }

  const participants   = passengers.length;
  const remainingSlots = product.quota - product.bookedSlots;
  if (participants > remainingSlots) {
    const err = new Error(`Slot tidak cukup. Sisa slot: ${remainingSlots}`);
    err.statusCode = 400;
    throw err;
  }

  const addOnTotal = (addOns || []).reduce((sum, a) => sum + a.price, 0);
  const totalPrice = (product.price * participants) + addOnTotal;

  const order = await Order.create({
    orderCode:  generateOrderCode(),
    userId,
    productId:  product._id,
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
    participants,
    passengers,
    addOns: addOns || [],
    note:   note   || null,
    totalPrice,
  });

  // Auto-save penumpang ke daftar tersimpan
  await autoSavePassengers(userId, passengers);

  return order;
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
