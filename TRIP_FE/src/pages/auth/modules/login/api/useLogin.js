import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../../../lib/axios.js';
import { useAuthStore } from '../../../../../stores/useAuthStore.js';
import { ROUTES } from '../../../../../utils/consts/routes.js';

export const useLogin = () => {
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();

  return useMutation({
    mutationFn: (credentials) => {
      // toast.promise menangani ketiga state:
      // loading → sukses → error — semuanya tampil sebagai toast
      const promise = api
        .post('/auth/login', credentials)
        .then((res) => res.data.data.data); // { accessToken, user }

      return toast.promise(promise, {
        loading: 'Memverifikasi...',
        success: (data) => `Selamat datang, ${data.user.name.split(' ')[0]}! 👋`,
        error:   (err)  =>
          err.response?.data?.errors?.[0]?.message ||
          'Login gagal. Periksa koneksi dan coba lagi.',
      });
    },

    onSuccess: ({ accessToken, user }) => {
      setAuth({ accessToken, user });
      navigate(
        user.role === 'admin' ? ROUTES.ADMIN.DASHBOARD : ROUTES.HOME,
        { replace: true }
      );
    },
    // onError tidak perlu toast.error() lagi — sudah ditangani toast.promise()
  });
};
