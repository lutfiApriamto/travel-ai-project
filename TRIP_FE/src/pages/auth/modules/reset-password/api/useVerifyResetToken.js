import { useMutation } from '@tanstack/react-query';
import api from '../../../../../lib/axios.js';

// Verifikasi token + email — Step 1 dari reset password flow.
// Sukses → return { name } (nama user untuk disapa).
// Error 400 → token invalid/expired atau email tidak cocok.
export const useVerifyResetToken = (token) => {
  return useMutation({
    mutationFn: async ({ email }) => {
      const res = await api.post(`/auth/verify-reset-token/${token}`, {
        email: email.trim().toLowerCase(),
      });
      return res.data.data.data; // { name }
    },
  });
};
