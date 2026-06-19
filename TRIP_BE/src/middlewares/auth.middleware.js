import { verifyToken } from '../utils/jwtHelper.js';
import { sendError }   from '../utils/apiResponse.js';
import asyncHandler    from '../utils/asyncHandler.js';
import User            from '../models/user.model.js';

const auth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Token tidak ditemukan', 401);
  }

  const token = authHeader.split(' ')[1];
  const { valid, decoded, errorName } = verifyToken(token);

  if (!valid) {
    const message = errorName === 'TokenExpiredError'
      ? 'Access token sudah expired, silakan refresh token'
      : 'Token tidak valid atau telah dirusak';
    return sendError(res, message, 401);
  }

  const user = await User.findById(decoded.id).select('-password -refreshToken -resetPasswordToken -resetPasswordExpiry');

  if (!user) return sendError(res, 'Akun tidak ditemukan', 401);

  // Cek suspend/ban — isActive: false berarti akun dinonaktifkan admin
  if (!user.isActive) return sendError(res, 'Akun Anda telah dinonaktifkan. Hubungi admin.', 403);

  req.user = user;
  next();
});

export default auth;
