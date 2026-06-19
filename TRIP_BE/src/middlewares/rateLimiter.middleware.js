import rateLimit from 'express-rate-limit';

// Limiter otomatis di-skip saat development agar tidak block pengujian berulang.
// Di production limiter aktif penuh. `skip` dievaluasi per-request.
export const createRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    limit:           max,
    standardHeaders: true,
    legacyHeaders:   false,
    skip:            () => process.env.NODE_ENV !== 'production',
    message: {
      errorStatus: true,
      errorType:   'TooManyRequests',
      errors:      [{ message, code: 429 }],
    },
  });
