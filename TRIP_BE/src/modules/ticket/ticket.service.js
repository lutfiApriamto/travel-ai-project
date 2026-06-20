import Ticket from '../../models/ticket.model.js';
import { generateTicketPdf }                      from '../../utils/pdfHelper.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

// Tambahkan computed field canUse ke tiket
const addCanUse = (ticket) => ({ ...ticket, canUse: ticket.isValid && !ticket.checkedIn });

// ─── User ─────────────────────────────────────────────────────────────────────

export const getMyTickets = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = { userId };

  if (query.status === 'valid')   { filter.isValid = true; filter.checkedIn = false; }
  if (query.status === 'used')    { filter.checkedIn = true; }
  if (query.status === 'invalid') { filter.isValid = false; }

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('productId', 'name slug thumbnail')
      .populate('orderId',   'orderCode paymentMethod paidAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  return { tickets: tickets.map(addCanUse), meta: buildPaginationMeta(total, page, limit) };
};

export const getMyTicketById = async (id, userId) => {
  const ticket = await Ticket.findOne({ _id: id, userId })
    .populate('productId', 'name slug thumbnail status')
    .populate('orderId',   'orderCode paymentMethod paidAt')
    .lean();

  if (!ticket) {
    const err = new Error('Tiket tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  return addCanUse(ticket);
};

export const downloadTicket = async (id, userId) => {
  const ticket = await Ticket.findOne({ _id: id, userId })
    .populate('userId', 'name email')
    .lean();

  if (!ticket) {
    const err = new Error('Tiket tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  return generateTicketPdf(ticket);
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllTickets = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = {};

  if (query.search) {
    const regex = { $regex: query.search, $options: 'i' };
    filter.$or = [
      { ticketCode:             regex },
      { 'productSnapshot.name': regex },
    ];
  }

  if (query.userId)                  filter.userId     = query.userId;
  if (query.isValid   !== undefined) filter.isValid    = query.isValid    === 'true';
  if (query.checkedIn !== undefined) filter.checkedIn  = query.checkedIn  === 'true';

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate)   filter.createdAt.$lte = new Date(query.endDate);
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate('userId',    'name email')
      .populate('productId', 'name slug')
      .populate('orderId',   'orderCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  return { tickets: tickets.map(addCanUse), meta: buildPaginationMeta(total, page, limit) };
};

export const getTicketById = async (id) => {
  const ticket = await Ticket.findById(id)
    .populate('userId',    'name email phone')
    .populate('productId', 'name slug thumbnail status')
    .populate('orderId',   'orderCode paymentMethod paidAt totalPrice')
    .lean();

  if (!ticket) {
    const err = new Error('Tiket tidak ditemukan');
    err.statusCode = 404;
    throw err;
  }

  return addCanUse(ticket);
};

export const checkIn = async (ticketCode) => {
  const ticket = await Ticket.findOne({ ticketCode })
    .populate('userId',    'name email phone')
    .populate('productId', 'name');

  if (!ticket) {
    const err = new Error('Tiket tidak ditemukan. Pastikan kode tiket sudah benar.');
    err.statusCode = 404;
    throw err;
  }

  if (!ticket.isValid) {
    const err = new Error('Tiket tidak valid — tiket ini telah dibatalkan atau di-refund dan tidak bisa digunakan.');
    err.statusCode = 400;
    throw err;
  }

  if (ticket.checkedIn) {
    const checkedAt = ticket.checkedInAt
      ? new Date(ticket.checkedInAt).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
      : 'waktu tidak diketahui';
    const err = new Error(
      `Tiket ini sudah digunakan untuk check-in pada ${checkedAt}. Satu tiket hanya berlaku untuk satu kali check-in.`
    );
    err.statusCode = 400;
    throw err;
  }

  ticket.checkedIn   = true;
  ticket.checkedInAt = new Date();
  await ticket.save();

  return {
    ticketCode:   ticket.ticketCode,
    checkedInAt:  ticket.checkedInAt,
    participants: ticket.participants,
    passenger: {
      name:  ticket.userId?.name  || '-',
      email: ticket.userId?.email || '-',
      phone: ticket.userId?.phone || '-',
    },
    trip: {
      productName:   ticket.productSnapshot?.name          || '-',
      departureDate: ticket.productSnapshot?.departureDate || null,
      departureCity: ticket.productSnapshot?.departureCity || '-',
      destinations:  ticket.productSnapshot?.destinations  || [],
      duration:      ticket.productSnapshot?.duration      || '-',
      meetingPoint:  ticket.productSnapshot?.meetingPoint  || '-',
    },
  };
};
