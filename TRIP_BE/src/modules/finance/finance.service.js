import Finance from '../../models/finance.model.js';
import { generateFinanceCsv }                      from '../../utils/csvHelper.js';
import { getPaginationParams, buildPaginationMeta } from '../../utils/paginate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildDateFilter = (query) => {
  const filter = {};
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate)   filter.createdAt.$lte = new Date(query.endDate);
  }
  return filter;
};

const getCurrentBalance = async () => {
  const latest = await Finance.findOne().sort({ createdAt: -1 }).lean();
  return latest?.balanceAfter ?? 0;
};

// ─── Balance ──────────────────────────────────────────────────────────────────

export const getBalance = async (query) => {
  const currentBalance = await getCurrentBalance();

  // All-time aggregate
  const allTime = await Finance.aggregate([
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  const totalIncome  = allTime.find((s) => s._id === 'income')?.total  ?? 0;
  const totalOutcome = allTime.find((s) => s._id === 'outcome')?.total ?? 0;

  const result = {
    currentBalance,
    allTime: {
      totalIncome,
      totalOutcome,
      net: totalIncome - totalOutcome,
    },
  };

  // Period summary jika startDate / endDate diberikan
  if (query.startDate || query.endDate) {
    const dateFilter = {};
    if (query.startDate) dateFilter.$gte = new Date(query.startDate);
    if (query.endDate)   dateFilter.$lte = new Date(query.endDate);

    const period = await Finance.aggregate([
      { $match: { createdAt: dateFilter } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]);

    const periodIncome  = period.find((s) => s._id === 'income')?.total  ?? 0;
    const periodOutcome = period.find((s) => s._id === 'outcome')?.total ?? 0;

    result.period = {
      startDate: query.startDate || null,
      endDate:   query.endDate   || null,
      income:    periodIncome,
      outcome:   periodOutcome,
      net:       periodIncome - periodOutcome,
    };
  }

  return result;
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const getTransactions = async (query) => {
  const { page, limit, skip } = getPaginationParams(query);
  const filter = buildDateFilter(query);

  if (query.type)     filter.type     = query.type;
  if (query.category) filter.category = query.category;

  const [transactions, total] = await Promise.all([
    Finance.find(filter)
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Finance.countDocuments(filter),
  ]);

  return { transactions, meta: buildPaginationMeta(total, page, limit) };
};

// ─── Withdrawal ───────────────────────────────────────────────────────────────

export const withdraw = async (adminId, { amount, description }) => {
  const currentBalance = await getCurrentBalance();

  if (amount > currentBalance) {
    const err = new Error(
      `Saldo tidak mencukupi. Saldo saat ini: Rp ${currentBalance.toLocaleString('id-ID')}`
    );
    err.statusCode = 400;
    throw err;
  }

  return Finance.create({
    type:         'outcome',
    category:     'withdrawal',
    amount,
    description:  description || 'Penarikan saldo oleh admin',
    balanceAfter: currentBalance - amount,
    processedBy:  adminId,
  });
};

// ─── Export CSV ───────────────────────────────────────────────────────────────

export const exportCsv = async (query) => {
  const filter = buildDateFilter(query);

  if (query.type)     filter.type     = query.type;
  if (query.category) filter.category = query.category;

  const transactions = await Finance.find(filter).sort({ createdAt: 1 }).lean();

  if (transactions.length === 0) {
    const err = new Error('Tidak ada data transaksi untuk diekspor');
    err.statusCode = 404;
    throw err;
  }

  return generateFinanceCsv(transactions);
};
