import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api   from '../../../lib/axios.js';
import { useCartStore }     from '../../../stores/useCartStore.js';
import { useWishlistStore } from '../../../stores/useWishlistStore.js';

// ─── Response format (sendSuccess) ───────────────────────────────────────────
// r.data.data.data      = actual payload
// r.data.data.totalData = (paginated only)
// r.data.data.totalPage = (paginated only)
// ─────────────────────────────────────────────────────────────────────────────

// Product by slug — public (optionalAuth), viewCount++ otomatis di backend
export const useProductDetail = (slug) =>
  useQuery({
    queryKey:  ['product', slug],
    queryFn:   () =>
      api.get(`/products/slug/${slug}`).then((r) => r.data.data.data),
    enabled:   !!slug,
    staleTime: 30_000,
  });

// Wishlist check — hanya jika isAuthenticated
export const useWishlistCheck = (productId, isAuthenticated) =>
  useQuery({
    queryKey:  ['wishlist', 'check', productId],
    queryFn:   () =>
      api.get(`/wishlist/check/${productId}`).then((r) => r.data.data.data),
    enabled:   !!productId && !!isAuthenticated,
    staleTime: 60_000,
  });

// Toggle wishlist (add / remove)
export const useToggleWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, isWishlisted }) =>
      isWishlisted
        ? api.delete(`/wishlist/${productId}`)
        : api.post(`/wishlist/${productId}`),
    onSuccess: (_, { productId, isWishlisted }) => {
      qc.setQueryData(['wishlist', 'check', productId], { isWishlisted: !isWishlisted });
      qc.invalidateQueries({ queryKey: ['wishlist'], exact: false });
      if (isWishlisted) {
        useWishlistStore.getState().decrement();
      } else {
        useWishlistStore.getState().increment();
      }
      toast.success(isWishlisted ? 'Dihapus dari wishlist' : 'Ditambahkan ke wishlist');
    },
    onError: (e) =>
      toast.error(
        e.response?.data?.data?.message ?? 'Gagal mengubah wishlist',
      ),
  });
};

// Add to cart — POST /cart/items
// body: { productId, participants, addOns: [{ name }], note? }
export const useAddToCart = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/cart/items', body),
    onSuccess: () => {
      // Invalidate cart server state
      qc.invalidateQueries({ queryKey: ['cart'] });
      // Update Zustand cart badge (getState works outside React)
      useCartStore.getState().increment();
      toast.success('Produk berhasil ditambahkan ke keranjang!');
    },
    onError: (e) =>
      toast.error(
        e.response?.data?.data?.message ?? 'Gagal menambahkan ke keranjang',
      ),
  });
};
