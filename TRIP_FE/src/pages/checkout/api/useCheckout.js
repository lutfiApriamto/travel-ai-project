import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast                           from 'react-hot-toast';
import api                             from '../../../lib/axios.js';
import { useCartStore }                from '../../../stores/useCartStore.js';

// ─── Response shape ───────────────────────────────────────────────────────────
// POST /orders { productIds: string[] }
//   → sendSuccess(res, data, '...', 201)  (data = Order[])
//   → r.data.data.data = Order[]
//
// Each Order: { _id, orderCode, totalPrice, status: 'pending_payment',
//              productSnapshot, participants, addOns, note, ... }
// ─────────────────────────────────────────────────────────────────────────────

export const useCheckout = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (productIds) =>
      api
        .post('/orders', { productIds })
        .then((r) => {
          const d = r.data.data.data;
          return Array.isArray(d) ? d : [];
        }),

    onSuccess: (orders, productIds) => {
      // Invalidate cart (backend sudah hapus item yang di-checkout)
      qc.invalidateQueries({ queryKey: ['cart'] });
      // Invalidate orders list
      qc.invalidateQueries({ queryKey: ['orders'] });
      // Kurangi badge navbar sesuai jumlah item yang di-checkout
      const current = useCartStore.getState().itemCount;
      useCartStore.getState().setItemCount(Math.max(0, current - productIds.length));
    },

    onError: (e) => {
      const msg =
        e.response?.data?.data?.message ??
        'Gagal membuat pesanan. Silakan coba lagi.';
      toast.error(msg);
    },
  });
};
