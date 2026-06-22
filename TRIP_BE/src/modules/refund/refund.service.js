import Refund       from '../../models/refund.model.js';
import RefundPolicy  from '../../models/refundPolicy.model.js';
import Order         from '../../models/order.model.js';
import Ticket        from '../../models/ticket.model.js';
import Product       from '../../models/product.model.js';
import Finance       from '../../models/finance.model.js';
import User          from '../../models/user.model.js';
import { daysBetween }                             from '../../utils/dateHelper.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';
import { createNotification }                      from '../../utils/notificationHelper.js';
import { sendMail }                                from '../../config/mailer.js';
import { refundApprovedTemplate }                  from '../../templates/refundApproved.template.js';
import { refundRejectedTemplate }                  from '../../templates/refundRejected.template.js';

// ─── Default Refund Policy ────────────────────────────────────────────────────

const DEFAULT_POLICY = {
  rules: [
    { minDaysBeforeDeparture: 14, maxDaysBeforeDeparture: null, refundPercentage: 100, description: 'Pembatalan H-14 atau lebih: refund 100%' },
    { minDaysBeforeDeparture: 7,  maxDaysBeforeDeparture: 13,   refundPercentage: 50,  description: 'Pembatalan H-7 sampai H-13: refund 50%' },
    { minDaysBeforeDeparture: 3,  maxDaysBeforeDeparture: 6,    refundPercentage: 25,  description: 'Pembatalan H-3 sampai H-6: refund 25%' },
    { minDaysBeforeDeparture: 0,  maxDaysBeforeDeparture: 2,    refundPercentage: 0,   description: 'Pembatalan H-0 sampai H-2: tidak ada refund' },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOrCreatePolicy = async () => {
  let policy = await RefundPolicy.findOne();
  if (!policy) policy = await RefundPolicy.create(DEFAULT_POLICY);
  return policy;
};

const calculateRefund = (departureDate, totalPrice, rules) => {
  const daysLeft = daysBetween(new Date(), departureDate);

  let percentage = 0;
  for (const rule of rules) {
    const meetsMin = daysLeft >= rule.minDaysBeforeDeparture;
    const meetsMax = rule.maxDaysBeforeDeparture === null || daysLeft <= rule.maxDaysBeforeDeparture;
    if (meetsMin && meetsMax) {
      percentage = rule.refundPercentage;
      break;
    }
  }

  return {
    daysLeft,
    percentage,
    amount: Math.floor(totalPrice * percentage / 100),
  };
};

// ─── Policy ───────────────────────────────────────────────────────────────────

export const getPolicy = async () => getOrCreatePolicy();

export const updatePolicy = async (adminId, { rules }) => {
  const policy = await getOrCreatePolicy();
  policy.rules     = rules;
  policy.updatedBy = adminId;
  return policy.save();
};

// ─── User ─────────────────────────────────────────────────────────────────────

export const submitRefund = async (userId, { orderId, reason }) => {
  const order = await Order.findById(orderId);

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

  if (order.status !== 'paid') {
    const err = new Error('Hanya order dengan status paid yang bisa diajukan refund');
    err.statusCode = 400;
    throw err;
  }

  // Cek apakah tanggal keberangkatan sudah lewat
  const daysLeft = daysBetween(new Date(), order.productSnapshot.departureDate);
  if (daysLeft < 0) {
    const err = new Error('Tidak dapat mengajukan refund — tanggal keberangkatan sudah lewat');
    err.statusCode = 400;
    throw err;
  }

  // Cek duplikat pengajuan (unique index di model akan catch ini, tapi lebih informatif dengan cek manual)
  const existing = await Refund.exists({ orderId });
  if (existing) {
    const err = new Error('Sudah ada pengajuan refund untuk order ini');
    err.statusCode = 409;
    throw err;
  }

  return Refund.create({ orderId, userId, reason });
};

export const getMyRefunds = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { userId };

  if (query.status) filter.status = query.status;

  const [refunds, total] = await Promise.all([
    Refund.find(filter)
      .populate('orderId', 'orderCode productSnapshot totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Refund.countDocuments(filter),
  ]);

  return { refunds, meta: buildPaginationMeta(total, page, limit) };
};

export const getMyRefundById = async (id, userId) => {
  const refund = await Refund.findOne({ _id: id, userId })
    .populate('orderId', 'orderCode productSnapshot totalPrice paymentMethod')
    .lean();

  if (!refund) {
    const err = new Error('Pengajuan refund tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  return refund;
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllRefunds = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.status)  filter.status  = query.status;
  if (query.userId)  filter.userId  = query.userId;

  if (query.search) {
    filter.$or = [
      { reason: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [refunds, total] = await Promise.all([
    Refund.find(filter)
      .populate('userId',  'name email')
      .populate('orderId', 'orderCode productSnapshot totalPrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Refund.countDocuments(filter),
  ]);

  return { refunds, meta: buildPaginationMeta(total, page, limit) };
};

export const getRefundById = async (id) => {
  const refund = await Refund.findById(id)
    .populate('userId',      'name email phone')
    .populate('orderId',     'orderCode productSnapshot totalPrice paymentMethod paidAt')
    .populate('processedBy', 'name email')
    .lean();

  if (!refund) {
    const err = new Error('Pengajuan refund tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  // Kalkulasi saran refund berdasarkan policy saat ini (hanya untuk status pending)
  let suggestedRefundAmount = null;
  let suggestedPercentage   = null;

  if (refund.status === 'pending' && refund.orderId?.productSnapshot?.departureDate) {
    const policy   = await getOrCreatePolicy();
    const { percentage, amount } = calculateRefund(
      refund.orderId.productSnapshot.departureDate,
      refund.orderId.totalPrice,
      policy.rules
    );
    suggestedRefundAmount = amount;
    suggestedPercentage   = percentage;
  }

  return { ...refund, suggestedRefundAmount, suggestedPercentage };
};

export const approveRefund = async (id, adminId) => {
  const refund = await Refund.findById(id).populate('orderId');

  if (!refund) {
    const err = new Error('Pengajuan refund tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (refund.status !== 'pending') {
    const err = new Error('Hanya pengajuan dengan status pending yang bisa diproses');
    err.statusCode = 400;
    throw err;
  }

  const order  = refund.orderId;
  const policy = await getOrCreatePolicy();
  const { percentage, amount } = calculateRefund(
    order.productSnapshot.departureDate,
    order.totalPrice,
    policy.rules
  );

  // 1. Update refund
  refund.status           = 'approved';
  refund.refundAmount     = amount;
  refund.refundPercentage = percentage;
  refund.processedBy      = adminId;
  refund.processedAt      = new Date();
  await refund.save();

  // 2. Update order
  await Order.findByIdAndUpdate(order._id, { status: 'refunded' });

  // 3. Invalidasi SEMUA tiket order ini (satu order kini punya banyak tiket)
  await Ticket.updateMany(
    { orderId: order._id },
    { isValid: false, invalidatedAt: new Date() }
  );

  // 4. Kembalikan slot produk jika belum expired (sejumlah peserta order)
  const product = await Product.findById(order.productId);
  if (product && product.status !== 'expired' && product.status !== 'cancelled') {
    const seatCount      = order.participants ?? 1;
    const newBookedSlots = Math.max(0, product.bookedSlots - seatCount);
    const newStatus      = product.status === 'full' && newBookedSlots < product.quota
      ? 'active'
      : product.status;
    await Product.findByIdAndUpdate(order.productId, {
      bookedSlots: newBookedSlots,
      status:      newStatus,
    });
  }

  // 5. Finance record (outcome)
  if (amount > 0) {
    const lastFinance = await Finance.findOne().sort({ createdAt: -1 }).lean();
    const prevBalance = lastFinance?.balanceAfter ?? 0;
    await Finance.create({
      type:         'outcome',
      category:     'refund',
      amount,
      description:  `Refund ${percentage}% untuk order ${order.orderCode}`,
      relatedId:    refund._id,
      relatedModel: 'Refund',
      balanceAfter: prevBalance - amount,
    });
  }

  // 6. Email + notifikasi
  const user = await User.findById(order.userId).select('name email');
  if (user) {
    const { subject, text, html } = refundApprovedTemplate({
      name:             user.name,
      orderCode:        order.orderCode,
      productName:      order.productSnapshot.name,
      refundAmount:     amount,
      refundPercentage: percentage,
    });
    await sendMail({ to: user.email, subject, text, html }).catch(() => {});
    await createNotification({
      userId:    order.userId,
      title:     'Refund Disetujui',
      message:   `Refund ${percentage}% (${amount > 0 ? `Rp ${amount.toLocaleString('id-ID')}` : 'tanpa pengembalian dana'}) untuk pesanan ${order.orderCode} telah diproses.`,
      type:      'refund_approved',
      relatedId: refund._id,
    }).catch(() => {});
  }

  return refund;
};

export const rejectRefund = async (id, adminId, { rejectionReason }) => {
  const refund = await Refund.findById(id).populate('orderId', 'orderCode productSnapshot userId');

  if (!refund) {
    const err = new Error('Pengajuan refund tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  if (refund.status !== 'pending') {
    const err = new Error('Hanya pengajuan dengan status pending yang bisa diproses');
    err.statusCode = 400;
    throw err;
  }

  refund.status      = 'rejected';
  refund.adminNote   = rejectionReason;
  refund.processedBy = adminId;
  refund.processedAt = new Date();
  await refund.save();

  // Email + notifikasi
  const user = await User.findById(refund.orderId.userId).select('name email');
  if (user) {
    const { subject, text, html } = refundRejectedTemplate({
      name:            user.name,
      orderCode:       refund.orderId.orderCode,
      productName:     refund.orderId.productSnapshot.name,
      rejectionReason,
    });
    await sendMail({ to: user.email, subject, text, html }).catch(() => {});
    await createNotification({
      userId:    refund.orderId.userId,
      title:     'Refund Ditolak',
      message:   `Pengajuan refund untuk pesanan ${refund.orderId.orderCode} ditolak. Alasan: ${rejectionReason}`,
      type:      'refund_rejected',
      relatedId: refund._id,
    }).catch(() => {});
  }

  return refund;
};
