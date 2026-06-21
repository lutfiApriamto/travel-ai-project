export const registerSchema = {
  type: 'object',
  required: ['name', 'email', 'password'],
  additionalProperties: false,
  properties: {
    name: {
      type: 'string',
      minLength: 2,
      maxLength: 100,
    },
    email: {
      type: 'string',
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
    },
    password: {
      type: 'string',
      minLength: 8,
    },
    phone: {
      type: 'string',
      pattern: '^[0-9+\\-\\s]{8,20}$',
    },
  },
};

export const loginSchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email:    { type: 'string' },
    password: { type: 'string' },
  },
};

export const forgotPasswordSchema = {
  type: 'object',
  required: ['email'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
  },
};

export const resetPasswordSchema = {
  type: 'object',
  required: ['newPassword'],
  additionalProperties: false,
  properties: {
    newPassword: { type: 'string', minLength: 8 },
  },
};

// Verifikasi token reset password + email sebelum user isi password baru.
// Token diambil dari URL param, email dari body.
export const verifyResetTokenSchema = {
  type: 'object',
  required: ['email'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
  },
};
