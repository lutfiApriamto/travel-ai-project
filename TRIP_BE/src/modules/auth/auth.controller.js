import asyncHandler    from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/apiResponse.js';
import * as authService from './auth.service.js';

// ─── Cookie Config ────────────────────────────────────────────────────────────

const COOKIE_NAME   = 'trip_refresh';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure:   IS_PRODUCTION,
  sameSite: IS_PRODUCTION ? 'None' : 'Lax',
  maxAge:   30 * 24 * 60 * 60 * 1000, // 30 hari
  path:     '/api/auth',
};

const setRefreshCookie   = (res, token) => res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
const clearRefreshCookie = (res)        => res.clearCookie(COOKIE_NAME, { path: '/api/auth' });

// ─── Controllers ─────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { accessToken, rawRefreshToken, user } = await authService.registerUser(req.body);
  setRefreshCookie(res, rawRefreshToken);
  sendSuccess(res, { accessToken, user }, 'Registrasi berhasil', 201);
});

export const registerAdmin = asyncHandler(async (req, res) => {
  const result = await authService.registerAdmin();
  sendSuccess(res, result, 'Admin berhasil dibuat', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { accessToken, rawRefreshToken, user } = await authService.login(req.body);
  setRefreshCookie(res, rawRefreshToken);
  sendSuccess(res, { accessToken, user }, 'Login berhasil');
});

export const refresh = asyncHandler(async (req, res) => {
  const { accessToken, rawRefreshToken, user } = await authService.refreshAccessToken(
    req.cookies[COOKIE_NAME]
  );
  setRefreshCookie(res, rawRefreshToken);
  sendSuccess(res, { accessToken, user }, 'Token berhasil diperbarui');
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.cookies[COOKIE_NAME]);
  clearRefreshCookie(res);
  sendSuccess(res, null, 'Logout berhasil');
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body);
  sendSuccess(res, null, 'Jika email Anda terdaftar, link reset password telah dikirim ke inbox Anda');
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword({
    token:       req.params.token,
    newPassword: req.body.newPassword,
  });
  sendSuccess(res, null, 'Password berhasil direset, silakan login dengan password baru Anda');
});
