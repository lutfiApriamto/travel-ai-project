import { sendError } from '../utils/apiResponse.js';

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Terjadi kesalahan pada server';
  let errors     = Array.isArray(err.errors) ? err.errors : null;

  // Mongoose: validasi schema gagal
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message    = 'Validasi data gagal';
    errors     = Object.values(err.errors).map((e) => ({
      message: `${e.path}: ${e.message}`,
      code:    400,
    }));
  }

  // Mongoose: duplicate key (email/slug/orderCode sudah dipakai)
  if (err.code === 11000) {
    statusCode  = 409;
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    message     = `${field} '${value}' sudah digunakan`;
  }

  // Mongoose: CastError — ID di params bukan ObjectId valid
  if (err.name === 'CastError') {
    statusCode = 400;
    message    = `Format ID tidak valid: ${err.value}`;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Token tidak valid';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Token sudah expired, silakan login ulang';
  }

  const errorType = err.name === 'ValidationError' ? 'ValidationError' : undefined;
  sendError(res, message, statusCode, errors, errorType);
};

export default errorHandler;
