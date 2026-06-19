import { filterXSS } from 'xss';

const cleanKey = (key) => {
  if (key.startsWith('$')) key = `_${key.slice(1)}`;
  return key.replace(/\./g, '_');
};

const sanitizeValue = (value) => {
  if (typeof value === 'string') return filterXSS(value);
  if (Array.isArray(value))      return value.map(sanitizeValue);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [cleanKey(k), sanitizeValue(v)])
    );
  }
  return value;
};

export const sanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  // Express 5: req.query adalah getter-only — tidak bisa di-assign langsung.
  if (req.query && typeof req.query === 'object') {
    Object.defineProperty(req, 'query', {
      value:        sanitizeValue(req.query),
      writable:     true,
      configurable: true,
      enumerable:   true,
    });
  }

  next();
};
