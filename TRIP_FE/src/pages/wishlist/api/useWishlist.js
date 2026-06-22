import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api   from '../../../lib/axios.js';
import { useWishlistStore } from '../../../stores/useWishlistStore.js';

// ─── Response shapes ──────────────────────────────────────────────────────────
// GET /wishlist → sendSuccess(res, products, '...', 200, meta) → paginated
//   r.data.data.data      = Product[] (limited fields: name,slug,thumbnail,price,status,categories,types,tags)
//   r.data.data.totalData = meta.total
//   r.data.data.totalPage = meta.totalPages
//
// DELETE /wishlist/:productId → sendSuccess(res, null, '...') → no payload
// ─────────────────────────────────────────────────────────────────────────────

const WISHLIST_KEY = ['wishlist'];

export const useWishlistData = (params = {}) =>
  useQuery({
    queryKey:  [...WISHLIST_KEY, 'list', params],
    queryFn:   () =>
      api
        .get('/wishlist', {
          params: {
            page:   params.page   || 1,
            limit:  params.limit  || 20,
            search: params.search || undefined,
          },
        })
        .then((r) => ({
          products:  Array.isArray(r.data.data.data) ? r.data.data.data : [],
          totalData: r.data.data.totalData ?? 0,
          totalPage: r.data.data.totalPage ?? 1,
        })),
    staleTime:       30_000,
    placeholderData: (prev) => prev,
  });

export const useRemoveFromWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId) => api.delete(`/wishlist/${productId}`),
    onSuccess: (_, productId) => {
      qc.invalidateQueries({ queryKey: WISHLIST_KEY });
      qc.setQueryData(['wishlist', 'check', productId], { isWishlisted: false });
      useWishlistStore.getState().decrement();
      toast.success('Dihapus dari wishlist');
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal menghapus dari wishlist'),
  });
};
