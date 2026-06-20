export const withdrawSchema = {
  type: 'object',
  required: ['amount'],
  additionalProperties: false,
  properties: {
    amount:      { type: 'number', minimum: 10000 },
    description: { type: 'string', maxLength: 200 },
  },
};
