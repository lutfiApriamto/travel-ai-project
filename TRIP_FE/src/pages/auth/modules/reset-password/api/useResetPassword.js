import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../../../lib/axios.js';

export const useResetPassword = (token) => {
  return useMutation({
    mutationFn: async ({ newPassword }) => {
      // Hanya kirim newPassword — backend pakai additionalProperties: false,
      // field tambahan seperti confirmPassword akan ditolak.
      await api.post(`/auth/reset-password/${token}`, { newPassword });
    },
    onError: (err) => {
      const message =
        err.response?.data?.errors?.[0]?.message ||
        'Gagal mereset password. Coba lagi.';
      toast.error(message);
    },
  });
};
