import { create } from 'zustand';

// Menyimpan jumlah item wishlist untuk badge di navbar.
// Data wishlist asli dikelola React Query (GET /api/wishlist).
export const useWishlistStore = create((set) => ({
  itemCount:    0,
  setItemCount: (count) => set({ itemCount: Math.max(0, Number(count) || 0) }),
  increment:    ()      => set((s) => ({ itemCount: s.itemCount + 1 })),
  decrement:    ()      => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
  reset:        ()      => set({ itemCount: 0 }),
}));
