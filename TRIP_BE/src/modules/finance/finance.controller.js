import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as svc        from './finance.service.js';

export const getBalance = asyncHandler(async (req, res) => {
  const data = await svc.getBalance(req.query);
  sendSuccess(res, data, 'Data saldo berhasil diambil');
});

export const getTransactions = asyncHandler(async (req, res) => {
  const { transactions, meta } = await svc.getTransactions(req.query);
  sendSuccess(res, transactions, 'Riwayat transaksi berhasil diambil', 200, meta);
});

export const withdraw = asyncHandler(async (req, res) => {
  const data = await svc.withdraw(req.user._id, req.body);
  sendSuccess(res, data, 'Withdrawal berhasil dicatat', 201);
});

export const exportCsv = asyncHandler(async (req, res) => {
  const csv      = await svc.exportCsv(req.query);
  const filename = `laporan-keuangan-${new Date().toISOString().split('T')[0]}.csv`;
  res.set({
    'Content-Type':        'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
  res.send(csv);
});
