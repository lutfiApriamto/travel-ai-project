import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../../../lib/axios.js';

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: async ({ email }) => {
      // Backend SELALU return 200 meski email tidak terdaftar (anti-enumeration).
      // data = null, yang penting request berhasil tanpa throw.
      await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase(),
      });
    },
    onError: (err) => {
      const message =
        err.response?.data?.errors?.[0]?.message ||
        'Gagal mengirim email. Periksa koneksi dan coba lagi.';
      toast.error(message);
    },
  });
};
