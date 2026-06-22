const passengerSchema = {
  type:     'object',
  required: ['nik', 'name', 'age', 'email'],
  additionalProperties: false,
  properties: {
    nik:   { type: 'string', pattern: '^[0-9]{16}$' },
    name:  { type: 'string', minLength: 1, maxLength: 100 },
    age:   { type: 'integer', minimum: 1, maximum: 120 },
    email: { type: 'string', minLength: 3 },
  },
};

// Checkout dari keranjang
export const checkoutSchema = {
  type: 'object',
  required: ['productIds', 'passengersMap'],
  additionalProperties: false,
  properties: {
    productIds: {
      type:     'array',
      items:    { type: 'string', minLength: 1 },
      minItems: 1,
      maxItems: 20,
    },
    // { [productId]: PassengerEntry[] }
    passengersMap: {
      type:                 'object',
      additionalProperties: {
        type:     'array',
        minItems: 1,
        items:    passengerSchema,
      },
    },
  },
};

// Checkout langsung dari halaman produk (bypass cart)
export const expressCheckoutSchema = {
  type: 'object',
  required: ['productId', 'passengers'],
  additionalProperties: false,
  properties: {
    productId: { type: 'string', minLength: 1 },
    addOns: {
      type:  'array',
      items: {
        type:       'object',
        required:   ['name', 'price'],
        properties: {
          name:  { type: 'string' },
          price: { type: 'number', minimum: 0 },
        },
      },
    },
    note:       { type: ['string', 'null'] },
    passengers: {
      type:     'array',
      minItems: 1,
      items:    passengerSchema,
    },
  },
};
