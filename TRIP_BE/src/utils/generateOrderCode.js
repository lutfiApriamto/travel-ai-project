import crypto from 'crypto';

// Format: ORD-YYYYMMDD-XXXX (XXXX = 4 karakter hex random, uppercase)
export const generateOrderCode = () => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, '0');
  const dd   = String(date.getDate()).padStart(2, '0');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();

  return `ORD-${yyyy}${mm}${dd}-${rand}`;
};
