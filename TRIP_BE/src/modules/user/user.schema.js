export const updateMeSchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name:   { type: 'string', minLength: 2, maxLength: 100 },
    phone:  { type: 'string', maxLength: 20 },
    avatar: { anyOf: [{ type: 'string', minLength: 1 }, { type: 'null' }] },
  },
};

export const changePasswordSchema = {
  type: 'object',
  required: ['currentPassword', 'newPassword'],
  additionalProperties: false,
  properties: {
    currentPassword: { type: 'string', minLength: 1 },
    newPassword:     { type: 'string', minLength: 8, maxLength: 100 },
  },
};
