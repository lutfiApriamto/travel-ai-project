import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api   from '../../../lib/axios.js';

// ─── Response shapes ──────────────────────────────────────────────────────────
// GET /orders/:id  → sendSuccess(res, data)
//   r.data.data.data = Order (full, with populated productId + userId)
//
// DELETE /orders/:id → sendSuccess(res, data)
//   r.data.data.data = cancelled Order
//
// POST /refunds { orderId, reason } → sendSuccess(res, data, '...', 201)
//   r.data.data.data = Refund
//   409 → refund sudah ada untuk order ini
// ─────────────────────────────────────────────────────────────────────────────

// ─── Order detail ─────────────────────────────────────────────────────────────

export const useOrderDetail = (orderId) =>
  useQuery({
    queryKey:  ['order', orderId],
    queryFn:   () =>
      api.get(`/orders/${orderId}`).then((r) => r.data.data.data),
    enabled:   !!orderId,
    staleTime: 30_000,
  });

// ─── Cancel order ─────────────────────────────────────────────────────────────

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) =>
      api.delete(`/orders/${orderId}`).then((r) => r.data.data.data),
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: ['order', orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Pesanan berhasil dibatalkan');
    },
    onError: (e) =>
      toast.error(
        e.response?.data?.data?.message ?? 'Gagal membatalkan pesanan',
      ),
  });
};

// ─── Submit refund ────────────────────────────────────────────────────────────

export const useSubmitRefund = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }) =>
      api.post('/refunds', { orderId, reason }).then((r) => r.data.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['refunds'] });
      toast.success(
        'Pengajuan refund berhasil dikirim! Admin akan memproses dalam 3×24 jam kerja.',
        { duration: 5000 },
      );
    },
    onError: (e) => {
      const status = e.response?.status;
      const msg    = e.response?.data?.data?.message;
      if (status === 409) {
        toast.error('Kamu sudah pernah mengajukan refund untuk pesanan ini.');
      } else {
        toast.error(msg ?? 'Gagal mengajukan refund');
      }
    },
  });
};
