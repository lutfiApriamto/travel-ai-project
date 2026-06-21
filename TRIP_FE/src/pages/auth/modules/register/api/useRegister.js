import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../../../lib/axios.js';
import { useAuthStore } from '../../../../../stores/useAuthStore.js';
import { ROUTES } from '../../../../../utils/consts/routes.js';

export const useRegister = () => {
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  return useMutation({
    mutationFn: (formData) => {
      // confirmPassword hanya untuk validasi frontend — TIDAK dikirim ke backend
      // (backend pakai additionalProperties: false, field ekstra akan ditolak)
      const body = {
        name:     formData.name.trim(),
        email:    formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      // Phone opsional — hanya sertakan jika diisi
      if (formData.phone?.trim()) {
        body.phone = formData.phone.trim();
      }

      const promise = api
        .post('/auth/register', body)
        .then((res) => res.data.data.data); // { accessToken, user }

      return toast.promise(promise, {
        loading: 'Membuat akun...',
        success: (data) =>
          `Selamat datang, ${data.user.name.split(' ')[0]}! Akun berhasil dibuat 🎉`,
        error: (err) =>
          err.response?.data?.errors?.[0]?.message ||
          'Gagal membuat akun. Coba lagi.',
      });
    },

    onSuccess: ({ accessToken, user }) => {
      setAuth({ accessToken, user });
      // Register selalu masuk sebagai user biasa
      navigate(ROUTES.HOME, { replace: true });
    },
  });
};
