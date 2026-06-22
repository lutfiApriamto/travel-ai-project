import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as authService from './auth.service.js';

// ─── Cookie Config ────────────────────────────────────────────────────────────

const COOKIE_NAME = 'trip_refresh';

// Deteksi HTTPS secara dinamis — works di balik reverse proxy (Vercel, Railway, Render, dll)
const isHttps = (req) =>
  req.secure ||
  req.headers['x-forwarded-proto'] === 'https' ||
  process.env.NODE_ENV === 'production';

const buildCookieOptions = (req) => ({
  httpOnly: true,
  secure:   isHttps(req),
  sameSite: isHttps(req) ? 'None' : 'Lax',
  maxAge:   30 * 24 * 60 * 60 * 1000, // 30 hari
  path:     '/',                         // kirim ke semua path backend
});

// Path lama yang dipakai sebelumnya — wajib dibersihkan agar tidak ada cookie
// duplikat (browser mengirim cookie path lebih spesifik lebih dulu, sehingga
// token basi di /api/auth terbaca lebih dulu → "Sesi tidak valid").
const LEGACY_PATH = '/api/auth';

const clearLegacyCookie = (res, req) =>
  res.clearCookie(COOKIE_NAME, {
    path:     LEGACY_PATH,
    secure:   isHttps(req),
    sameSite: isHttps(req) ? 'None' : 'Lax',
  });

const setRefreshCookie = (res, token, req) => {
  // Bersihkan cookie legacy path lama sebelum set yang baru (self-healing)
  clearLegacyCookie(res, req);
  res.cookie(COOKIE_NAME, token, buildCookieOptions(req));
};

const clearRefreshCookie = (res, req) => {
  clearLegacyCookie(res, req);
  res.clearCookie(COOKIE_NAME, { path: '/', secure: isHttps(req), sameSite: isHttps(req) ? 'None' : 'Lax' });
};

// Ambil SEMUA nilai cookie bernama `name` dari raw header.
// cookie-parser hanya mengembalikan satu nilai jika ada cookie duplikat
// (mis. orphan path=/api/auth + path=/), sehingga bisa membaca token basi.
// Dengan membaca semua kandidat, kita bisa coba tiap nilai ke DB.
const getAllCookieValues = (req, name) => {
  const header = req.headers?.cookie || '';
  return header
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.startsWith(`${name}=`))
    .map((s) => {
      try { return decodeURIComponent(s.slice(name.length + 1)); }
      catch { return s.slice(name.length + 1); }
    })
    .filter(Boolean);
};

// ─── Controllers ─────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { accessToken, rawRefreshToken, user } = await authService.registerUser(req.body);
  setRefreshCookie(res, rawRefreshToken, req);
  sendSuccess(res, { accessToken, user }, 'Registrasi berhasil', 201);
});

export const registerAdmin = asyncHandler(async (req, res) => {
  const result = await authService.registerAdmin();
  sendSuccess(res, result, 'Admin berhasil dibuat', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, rawRefreshToken, user } = await authService.login(req.body);
  setRefreshCookie(res, rawRefreshToken, req);
  sendSuccess(res, { accessToken, user }, 'Login berhasil');
});

export const refresh = asyncHandler(async (req, res) => {
  // Kirim semua kandidat token (handle cookie duplikat)
  const candidates = getAllCookieValues(req, COOKIE_NAME);
  const { accessToken, rawRefreshToken, user } = await authService.refreshAccessToken(candidates);
  setRefreshCookie(res, rawRefreshToken, req);
  sendSuccess(res, { accessToken, user }, 'Token berhasil diperbarui');
});

export const logout = asyncHandler(async (req, res) => {
  // Logout semua kandidat token agar tidak ada yang tertinggal di DB
  await authService.logout(getAllCookieValues(req, COOKIE_NAME));
  clearRefreshCookie(res, req);
  sendSuccess(res, null, 'Logout berhasil');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  sendSuccess(res, null, 'Jika email Anda terdaftar, link reset password telah dikirim ke inbox Anda');
});

export const verifyResetToken = asyncHandler(async (req, res) => {
  const result = await authService.verifyResetToken({
    token: req.params.token,
    email: req.body.email,
  });
  sendSuccess(res, result, 'Token valid');
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword({
    token:       req.params.token,
    newPassword: req.body.newPassword,
  });
  sendSuccess(res, null, 'Password berhasil direset, silakan login dengan password baru Anda');
});
