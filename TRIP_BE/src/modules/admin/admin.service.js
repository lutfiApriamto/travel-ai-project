import mongoose from 'mongoose';
import User     from '../../models/user.model.js';
import Order    from '../../models/order.model.js';
import Product  from '../../models/product.model.js';
import Refund   from '../../models/refund.model.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildTrendSkeleton = (days) => {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({ date: d.toISOString().slice(0, 10), orders: 0, revenue: 0 });
  }
  return result;
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const getDashboard = async (query) => {
  const days      = Math.min(365, Math.max(1, parseInt(query.days) || 30));
  const trendStart = new Date();
  trendStart.setDate(trendStart.getDate() - days + 1);
  trendStart.setHours(0, 0, 0, 0);

  const soonDate = new Date();
  soonDate.setDate(soonDate.getDate() + 7);

  const [
    totalOrders,
    totalRevenue,
    totalUsers,
    activeProducts,
    pendingRefunds,
    expiringSoon,
    recentOrders,
    recentUsers,
    topBySold,
    topByView,
    rawTrend,
  ] = await Promise.all([
    // ── Stats ──
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ status: 'active' }),
    Refund.countDocuments({ status: 'pending' }),
    Product.countDocuments({
      status:        { $in: ['active', 'full'] },
      departureDate: { $gte: new Date(), $lte: soonDate },
    }),

    // ── Recent Activity ──
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId',    'name email')
      .populate('productId', 'name')
      .select('orderCode status totalPrice createdAt productSnapshot.name')
      .lean(),

    User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email avatar isActive createdAt')
      .lean(),

    // ── Top Products ──
    Product.find({ status: { $in: ['active', 'full', 'expired'] } })
      .sort({ soldCount: -1 })
      .limit(5)
      .select('name slug thumbnail soldCount departureDate')
      .lean(),

    Product.find({ status: { $in: ['active', 'full', 'expired'] } })
      .sort({ viewCount: -1 })
      .limit(5)
      .select('name slug thumbnail viewCount departureDate')
      .lean(),

    // ── Trend ──
    Order.aggregate([
      { $match: { status: 'paid', paidAt: { $gte: trendStart } } },
      {
        $group: {
          _id:     { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          orders:  { $sum: 1 },
          revenue: { $sum: '$totalPrice' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Isi tanggal yang tidak ada transaksi dengan 0
  const trendMap = new Map(rawTrend.map((d) => [d._id, d]));
  const trend    = buildTrendSkeleton(days).map((skeleton) => {
    const match = trendMap.get(skeleton.date);
    return match ? { date: match._id, orders: match.orders, revenue: match.revenue } : skeleton;
  });

  return {
    stats: {
      totalOrders,
      totalRevenue: totalRevenue[0]?.total ?? 0,
      totalUsers,
      activeProducts,
      pendingRefunds,
      expiringSoon,
    },
    recentActivity: {
      orders: recentOrders,
      users:  recentUsers,
    },
    topProducts: {
      bySoldCount: topBySold,
      byViewCount: topByView,
    },
    trend,
    trendDays: days,
  };
};

// ─── List semua user ──────────────────────────────────────────────────────────

export const getUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const filter = { role: 'user' };
  if (query.search) {
    const regex  = new RegExp(query.search, 'i');
    filter.$or   = [{ name: regex }, { email: regex }];
  }
  if (query.isActive === 'true')  filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password -refreshToken -resetPasswordToken -resetPasswordExpiry')
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, meta: buildPaginationMeta(total, page, limit) };
};

// ─── Detail user + ringkasan aktivitas ───────────────────────────────────────

export const getUserDetail = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('ID user tidak valid');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({ _id: userId, role: 'user' })
    .select('-password -refreshToken -resetPasswordToken -resetPasswordExpiry')
    .lean();

  if (!user) {
    const err = new Error('User tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  const uid = new mongoose.Types.ObjectId(userId);

  const [orderCount, spentResult, refundCount] = await Promise.all([
    Order.countDocuments({ userId: uid }),
    Order.aggregate([
      { $match: { userId: uid, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]),
    Refund.countDocuments({ userId: uid }),
  ]);

  return {
    ...user,
    summary: {
      totalOrders:  orderCount,
      totalSpent:   spentResult[0]?.total ?? 0,
      totalRefunds: refundCount,
    },
  };
};

// ─── Suspend / unsuspend user ─────────────────────────────────────────────────

export const toggleSuspend = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    const err = new Error('ID user tidak valid');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }
  if (user.role === 'admin') {
    const err = new Error('Akun admin tidak bisa di-suspend');
    err.statusCode = 403;
    throw err;
  }

  user.isActive = !user.isActive;
  await user.save();

  return {
    userId:   user._id,
    isActive: user.isActive,
    message:  user.isActive ? 'User berhasil diaktifkan kembali' : 'User berhasil di-suspend',
  };
};
