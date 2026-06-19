import Ajv        from 'ajv';
import { sendError } from '../utils/apiResponse.js';

const ajv = new Ajv({ allErrors: true, coerceTypes: true });

const validate = (schema) => (req, res, next) => {
  const validateFn = ajv.compile(schema);
  const valid      = validateFn(req.body);

  if (!valid) {
    const errors = validateFn.errors.map((err) => {
      const field = err.instancePath.replace('/', '') || err.params?.missingProperty || 'unknown';
      return { message: `${field}: ${err.message}`, code: 400 };
    });
    return sendError(res, 'Data yang dikirim tidak valid', 400, errors, 'ValidationError');
  }

  next();
};

export default validate;
