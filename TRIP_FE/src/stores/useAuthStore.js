import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user:            null,
  accessToken:     null,
  isAuthenticated: false,

  setAuth: ({ accessToken, user }) =>
    set({ accessToken, user, isAuthenticated: true }),

  clearAuth: () =>
    set({ user: null, accessToken: null, isAuthenticated: false }),

  // Dipakai saat user update profil agar navbar langsung reflect perubahan
  updateUser: (userData) =>
    set((state) => ({ user: { ...state.user, ...userData } })),
}));
