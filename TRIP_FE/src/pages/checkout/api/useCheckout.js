import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast                           from 'react-hot-toast';
import api                             from '../../../lib/axios.js';
import { useCartStore }                from '../../../stores/useCartStore.js';

// ─── Checkout dari keranjang ──────────────────────────────────────────────────
// POST /orders { productIds: string[], passengersMap: { [pid]: Passenger[] } }
// → r.data.data.data = Order[]

export const useCheckout = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ productIds, passengersMap }) =>
      api
        .post('/orders', { productIds, passengersMap })
        .then((r) => {
          const d = r.data.data.data;
          return Array.isArray(d) ? d : [];
        }),

    onSuccess: (orders, { productIds }) => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['passengers'] });
      const current = useCartStore.getState().itemCount;
      useCartStore.getState().setItemCount(Math.max(0, current - productIds.length));
    },

    onError: (e) => {
      const msg =
        e.response?.data?.data?.message ??
        e.response?.data?.errors?.[0]?.message ??
        'Gagal membuat pesanan. Silakan coba lagi.';
      toast.error(msg);
    },
  });
};

// ─── Express checkout (langsung dari halaman produk) ─────────────────────────
// POST /orders/express { productId, addOns, note, passengers }
// → r.data.data.data = Order (single)

export const useExpressCheckout = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload) =>
      api
        .post('/orders/express', payload)
        .then((r) => r.data.data.data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['passengers'] });
    },

    onError: (e) => {
      const msg =
        e.response?.data?.data?.message ??
        e.response?.data?.errors?.[0]?.message ??
        'Gagal membuat pesanan. Silakan coba lagi.';
      toast.error(msg);
    },
  });
};
