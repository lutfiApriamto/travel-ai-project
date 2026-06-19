import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;

export const signToken = (payload, expiresIn = '15m') => {
  return jwt.sign(payload, SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, SECRET);
    return { valid: true, decoded };
  } catch (err) {
    return { valid: false, decoded: null, errorName: err.name };
  }
};
