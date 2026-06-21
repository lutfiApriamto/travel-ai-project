import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect }    from 'react';
import toast            from 'react-hot-toast';
import api              from '../../../lib/axios.js';
import { useAuthStore } from '../../../stores/useAuthStore.js';

// ─── Response shape ───────────────────────────────────────────────────────────
// GET /users/me → sendSuccess(res, data)
//   r.data.data.data = User (safe fields — tanpa password/refreshToken/dll)
//   Fields: _id, name, email, phone, avatar, role, isActive, createdAt, updatedAt
// ─────────────────────────────────────────────────────────────────────────────

const PROFILE_KEY = ['profile', 'me'];

export const useMyProfile = () => {
  const setAuth = useAuthStore((s) => s.setAuth);

  const query = useQuery({
    queryKey:  PROFILE_KEY,
    queryFn:   () =>
      api.get('/users/me').then((r) => r.data.data.data),
    staleTime: 5 * 60_000, // 5 menit
  });

  // Sinkronisasi data fresh ke Zustand agar Navbar/ProfileDropdown ikut update
  useEffect(() => {
    if (query.data) {
      const stored = useAuthStore.getState();
      setAuth({ accessToken: stored.accessToken, user: query.data });
    }
  }, [query.data, setAuth]);

  return query;
};

// ─── Update profile ───────────────────────────────────────────────────────────
// PATCH /users/me { name?, phone?, avatar? }
// r.data.data.data = updated User (safe fields)

export const useUpdateProfile = () => {
  const qc      = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: (body) =>
      api.patch('/users/me', body).then((r) => r.data.data.data),
    onSuccess: (updatedUser) => {
      qc.invalidateQueries({ queryKey: PROFILE_KEY });
      // Sync user terbaru ke Zustand agar Navbar ikut update
      const { accessToken } = useAuthStore.getState();
      setAuth({ accessToken, user: updatedUser });
      toast.success('Profil berhasil diperbarui!');
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal memperbarui profil'),
  });
};

// ─── Change password ──────────────────────────────────────────────────────────
// PATCH /users/me/change-password { currentPassword, newPassword }
// Rate limit: 5 per 15 menit → 429 error
// r.data.data.data = null (backend kirim email notifikasi setelah sukses)

export const useChangePassword = () =>
  useMutation({
    mutationFn: ({ currentPassword, newPassword }) =>
      api.patch('/users/me/change-password', { currentPassword, newPassword }),
    onError: (e) => {
      const status = e.response?.status;
      const msg    = e.response?.data?.data?.message;
      if (status === 429) {
        toast.error('Terlalu banyak percobaan. Silakan coba lagi setelah 15 menit.');
      } else {
        toast.error(msg ?? 'Gagal mengubah password');
      }
    },
  });

// ─── Upload avatar ────────────────────────────────────────────────────────────
// POST /users/me/avatar (multipart/form-data, field: 'image')
// r.data.data.data = URL string (Supabase public URL)

export const useUploadAvatar = () =>
  useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append('image', file);
      return api
        .post('/users/me/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data.data.data); // returns URL string
    },
    onError: (e) =>
      toast.error(e.response?.data?.data?.message ?? 'Gagal upload foto profil'),
  });
