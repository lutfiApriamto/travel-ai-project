import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api   from '../../../lib/axios.js';

// ─── Response shapes ──────────────────────────────────────────────────────────
// GET /orders → sendSuccess(res, orders, '...', 200, meta)
//   r.data.data.data      = Order[]
//   r.data.data.totalData = meta.total
//   r.data.data.totalPage = meta.totalPages
//
// DELETE /orders/:id → sendSuccess(res, data, '...')
//   r.data.data.data = cancelled Order
// ─────────────────────────────────────────────────────────────────────────────

const ORDERS_KEY = ['orders'];

export const useOrders = (params = {}) =>
  useQuery({
    queryKey:  [...ORDERS_KEY, params],
    queryFn:   () =>
      api
        .get('/orders', {
          params: {
            page:       params.page       || 1,
            limit:      params.limit      || 10,
            status:     params.status     || undefined,
            search:     params.search     || undefined,
            startDate:  params.startDate  || undefined,
            endDate:    params.endDate    || undefined,
          },
        })
        .then((r) => ({
          orders:    Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData: r.data.data.totalData ?? 0,
          totalPage: r.data.data.totalPage ?? 1,
        })),
    placeholderData: (prev) => prev,
    staleTime:       30_000,
  });

export const useCancelOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) =>
      api.delete(`/orders/${orderId}`).then((r) => r.data.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
      toast.success('Pesanan berhasil dibatalkan');
    },
    onError: (e) =>
      toast.error(
        e.response?.data?.data?.message ?? 'Gagal membatalkan pesanan',
      ),
  });
};
