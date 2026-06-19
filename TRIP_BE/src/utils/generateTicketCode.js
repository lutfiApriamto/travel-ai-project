import crypto from 'crypto';

// Format: TRIP-XXXX-XXXX (8 karakter hex random, uppercase, dibagi dua)
export const generateTicketCode = () => {
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TRIP-${rand.slice(0, 4)}-${rand.slice(4, 8)}`;
};
