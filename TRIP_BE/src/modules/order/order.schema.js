export const checkoutSchema = {
  type: 'object',
  required: ['productIds'],
  additionalProperties: false,
  properties: {
    productIds: {
      type:     'array',
      items:    { type: 'string', minLength: 1 },
      minItems: 1,
      maxItems: 20,
    },
  },
};
