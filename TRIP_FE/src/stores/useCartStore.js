import { create } from 'zustand';

// Hanya menyimpan jumlah item untuk badge di navbar.
// Data cart asli dikelola React Query (GET /api/cart).
export const useCartStore = create((set) => ({
  itemCount:    0,
  setItemCount: (count) => set({ itemCount: count }),
  increment:    ()      => set((s) => ({ itemCount: s.itemCount + 1 })),
  decrement:    ()      => set((s) => ({ itemCount: Math.max(0, s.itemCount - 1) })),
  reset:        ()      => set({ itemCount: 0 }),
}));
