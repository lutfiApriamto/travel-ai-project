import { verifyToken } from '../utils/jwtHelper.js';
import asyncHandler    from '../utils/asyncHandler.js';
import User            from '../models/user.model.js';

// Digunakan di route publik yang membutuhkan konteks user jika sedang login,
// tapi tetap bisa diakses tanpa token (mis. halaman daftar produk).
// Jika token ada dan valid → req.user terisi. Jika tidak → req.user = null, lanjut.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  const { valid, decoded } = verifyToken(token);

  if (!valid) {
    req.user = null;
    return next();
  }

  const user = await User.findById(decoded.id).select('-password -refreshToken -resetPasswordToken -resetPasswordExpiry');
  req.user = (user && user.isActive) ? user : null;
  next();
});

export default optionalAuth;
