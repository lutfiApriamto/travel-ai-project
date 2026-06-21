import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../lib/axios.js';

// ─── Policy (public — tidak butuh auth) ──────────────────────────────────────
// GET /refunds/policy → sendSuccess(res, data)
// r.data.data.data = { rules: [...], updatedBy, updatedAt, createdAt }

export const useRefundPolicy = () =>
  useQuery({
    queryKey:  ['refund-policy'],
    queryFn:   () => api.get('/refunds/policy').then(r => r.data.data.data),
    staleTime: 10 * 60_000,
  });

// ─── User refunds list ────────────────────────────────────────────────────────
// GET /refunds/my → sendSuccess(res, refunds, '...', 200, meta)
//   r.data.data.data      = Refund[] (paginated)
//   r.data.data.totalData = meta.total
//   r.data.data.totalPage = meta.totalPages
//
// Each Refund: {
//   _id, reason, status (pending|approved|rejected),
//   refundAmount, refundPercentage, adminNote,
//   processedAt, createdAt,
//   orderId: { orderCode, productSnapshot, totalPrice }  ← populated
// }

// ─── Paid orders (untuk order selector di form refund baru) ──────────────────
// GET /orders?status=paid → paginated, ambil limit besar agar semua terlihat
// r.data.data.data = Order[]

export const useMyPaidOrders = () =>
  useQuery({
    queryKey:  ['orders', { status: 'paid', limit: 50 }],
    queryFn:   () =>
      api
        .get('/orders', { params: { status: 'paid', limit: 50 } })
        .then((r) => (Array.isArray(r.data.data.data) ? r.data.data.data : [])),
    staleTime: 30_000,
  });

// ─── Submit refund ────────────────────────────────────────────────────────────
// POST /refunds { orderId, reason } → sendSuccess(res, data, '...', 201)
// Validasi backend: order harus paid, departure belum lewat, belum ada refund (409)

export const useSubmitRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }) =>
      api.post('/refunds', { orderId, reason }).then((r) => r.data.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['refunds', 'my'] });
      toast.success(
        'Pengajuan refund berhasil dikirim! Admin akan memproses dalam 3×24 jam kerja.',
        { duration: 5000 },
      );
    },
    onError: (e) => {
      const status = e.response?.status;
      const msg    = e.response?.data?.data?.message;
      if (status === 409) {
        toast.error('Sudah ada pengajuan refund untuk pesanan ini.');
      } else {
        toast.error(msg ?? 'Gagal mengajukan refund');
      }
    },
  });
};

export const useMyRefunds = (params = {}) =>
  useQuery({
    queryKey:  ['refunds', 'my', params],
    queryFn:   () =>
      api
        .get('/refunds/my', {
          params: {
            page:   params.page   || 1,
            limit:  params.limit  || 10,
            status: params.status || undefined,
          },
        })
        .then((r) => ({
          refunds:   Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData: r.data.data.totalData ?? 0,
          totalPage: r.data.data.totalPage ?? 1,
        })),
    placeholderData: (prev) => prev,
    staleTime:       30_000,
  });
