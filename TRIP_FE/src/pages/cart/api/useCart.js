import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api   from '../../../lib/axios.js';
import { useCartStore } from '../../../stores/useCartStore.js';

// ─── Response shapes ──────────────────────────────────────────────────────────
// GET /cart  → sendSuccess(res, items, '...', 200, meta)
//   r.data.data.data      = CartItem[]
//   r.data.data.totalData = meta.total
//   r.data.data.totalPage = meta.totalPages
//
// CartItem = {
//   productId, participants, addOns[{name,price}], note,
//   product: { _id, name, slug, thumbnail, price, status, quota, bookedSlots,
//              addOns, departureDate, returnDate, duration, departureCity },
//   isAvailable: bool
// }
//
// All mutations return sendSuccess(res, null, '...') → no payload
// ─────────────────────────────────────────────────────────────────────────────

const CART_KEY = ['cart'];

export const useCartData = (params = {}, options = {}) =>
  useQuery({
    queryKey:  [...CART_KEY, params],
    queryFn:   () =>
      api
        .get('/cart', {
          params: {
            page:   params.page   || 1,
            limit:  params.limit  || 20,
            search: params.search || undefined,
          },
        })
        .then((r) => ({
          items:     Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData: r.data.data.totalData ?? 0,
          totalPage: r.data.data.totalPage ?? 1,
        })),
    staleTime:       30_000,
    placeholderData: (prev) => prev,
    enabled:         options.enabled ?? true,
  });

export const useAddToCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/cart/items', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_KEY });
      useCartStore.getState().increment();
      toast.success('Ditambahkan ke keranjang!');
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal menambahkan ke keranjang'),
  });
};

export const useUpdateCartItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...body }) =>
      api.patch(`/cart/items/${productId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_KEY });
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal memperbarui item'),
  });
};

export const useRemoveCartItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId) => api.delete(`/cart/items/${productId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_KEY });
      useCartStore.getState().decrement();
      toast.success('Item dihapus dari keranjang');
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal menghapus item'),
  });
};

export const useClearCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.delete('/cart'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CART_KEY });
      useCartStore.getState().reset();
      toast.success('Keranjang berhasil dikosongkan');
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal mengosongkan keranjang'),
  });
};
