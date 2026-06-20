const addOnSelectSchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 100 },
  },
};

export const addCartItemSchema = {
  type: 'object',
  required: ['productId', 'participants'],
  additionalProperties: false,
  properties: {
    productId:    { type: 'string', minLength: 1 },
    participants: { type: 'integer', minimum: 1 },
    addOns:       { type: 'array', items: addOnSelectSchema },
    note:         { type: 'string', maxLength: 500 },
  },
};

export const updateCartItemSchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    participants: { type: 'integer', minimum: 1 },
    addOns:       { type: 'array', items: addOnSelectSchema },
    note:         { type: 'string', maxLength: 500 },
  },
};
