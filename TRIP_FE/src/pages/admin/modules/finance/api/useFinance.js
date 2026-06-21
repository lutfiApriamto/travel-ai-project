import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api   from '../../../../../lib/axios.js';

const FINANCE_KEY = ['admin', 'finance'];

// ─── Balance (+ period summary jika ada startDate / endDate) ─────────────────
// GET /finance/balance → sendSuccess(res, data)
// r.data.data.data = { currentBalance, allTime: { totalIncome, totalOutcome, net }, period? }

export const useBalance = (params = {}) =>
  useQuery({
    queryKey:  [...FINANCE_KEY, 'balance', params],
    queryFn:   () =>
      api.get('/finance/balance', {
        params: {
          startDate: params.startDate || undefined,
          endDate:   params.endDate   || undefined,
        },
      }).then(r => r.data.data.data),
    staleTime: 30_000,
  });

// ─── Transactions (paginated) ─────────────────────────────────────────────────
// GET /finance/transactions → sendSuccess(res, transactions, '...', 200, meta)
// r.data.data.data = transactions[], r.data.data.totalData, r.data.data.totalPage

export const useTransactions = (params = {}) =>
  useQuery({
    queryKey:  [...FINANCE_KEY, 'transactions', params],
    queryFn:   () =>
      api.get('/finance/transactions', {
        params: {
          page:      params.page      || 1,
          limit:     params.limit     || 15,
          type:      params.type      || undefined,
          category:  params.category  || undefined,
          startDate: params.startDate || undefined,
          endDate:   params.endDate   || undefined,
        },
      }).then(r => ({
        transactions: r.data.data.data,
        totalData:    r.data.data.totalData,
        totalPage:    r.data.data.totalPage,
      })),
    staleTime:       30_000,
    placeholderData: prev => prev,
  });

// ─── Withdraw ─────────────────────────────────────────────────────────────────
// POST /finance/withdraw → { amount, description? }
// amount min 10000, description max 200

export const useWithdraw = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/finance/withdraw', body).then(r => r.data.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FINANCE_KEY });
      toast.success('Penarikan saldo berhasil dicatat');
    },
    onError: (e) =>
      toast.error(e.response?.data?.errors?.[0]?.message ?? 'Gagal melakukan penarikan'),
  });
};

// ─── Export CSV (plain function — triggers browser download) ──────────────────
// GET /finance/export/csv → raw CSV (Content-Disposition attachment)

export const downloadFinanceCsv = async (params = {}) => {
  try {
    const res = await api.get('/finance/export/csv', {
      params: {
        type:      params.type      || undefined,
        category:  params.category  || undefined,
        startDate: params.startDate || undefined,
        endDate:   params.endDate   || undefined,
      },
      responseType: 'blob',
    });

    const url  = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }));
    const date = new Date().toISOString().split('T')[0];
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `laporan-keuangan-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  } catch (error) {
    // Saat responseType:'blob', error response body juga Blob — convert ke text dulu
    if (error.response?.data instanceof Blob) {
      const text    = await error.response.data.text();
      let   message = 'Gagal mengekspor data';
      try {
        const parsed = JSON.parse(text);
        message = parsed?.errors?.[0]?.message ?? message;
      } catch { /* biarkan pesan default */ }
      throw new Error(message);
    }
    throw error;
  }
};
