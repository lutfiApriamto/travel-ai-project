import { create } from 'zustand';

// Store untuk unread notification count — dipakai Navbar bell badge + halaman notifikasi
export const useNotificationStore = create((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: Math.max(0, Number(count) || 0) }),
  decrement:      ()      => set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) })),
  reset:          ()      => set({ unreadCount: 0 }),
}));
