import axios from 'axios';
import { useAuthStore } from '../stores/useAuthStore.js';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, // wajib untuk kirim HttpOnly cookie trip_refresh ke /api/auth/*
  timeout:         8000, // 8 detik — cegah loading tak terbatas jika backend tidak merespons
});

// ─── Refresh queue ────────────────────────────────────────────────────────────
// Mencegah banyak request 401 memicu banyak refresh sekaligus.
// Semua request yang gagal 401 saat refresh sedang berjalan di-queue,
// lalu di-retry setelah refresh selesai.

let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

// ─── Request interceptor ──────────────────────────────────────────────────────
// Attach access token dari Zustand store ke setiap request.
// Gunakan .getState() bukan hook — aman dipanggil di luar React component.

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Response interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;
    const status          = error.response?.status;

    // Hanya tangani 401. Skip jika:
    // 1. Bukan 401
    // 2. Sudah pernah di-retry (_retry flag)
    // 3. Request ke endpoint /auth/* — login/register/forgot/refresh tidak perlu
    //    refresh token. Tanpa ini, 401 dari /auth/login (salah password)
    //    akan memicu refresh → redirect loop ke halaman login.
    if (
      status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/')
    ) {
      return Promise.reject(error);
    }

    // Jika sudah ada refresh yang berjalan, queue request ini
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    // Mulai refresh
    originalRequest._retry = true;
    isRefreshing           = true;

    try {
      // Backend set cookie trip_refresh baru otomatis di response ini
      const res = await api.post('/auth/refresh');
      const { accessToken, user } = res.data.data.data;

      useAuthStore.getState().setAuth({ accessToken, user });
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      processQueue(null, accessToken);
      return api(originalRequest);

    } catch (refreshError) {
      // Refresh gagal → session berakhir → paksa logout
      processQueue(refreshError, null);
      useAuthStore.getState().clearAuth();
      window.location.href = '/auth/login';
      return Promise.reject(refreshError);

    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
