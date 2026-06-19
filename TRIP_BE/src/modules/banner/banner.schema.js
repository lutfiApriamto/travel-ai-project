export const createBannerSchema = {
  type: 'object',
  required: ['title'],
  additionalProperties: false,
  properties: {
    title: { type: 'string', minLength: 2, maxLength: 150 },
    link:  { type: 'string', maxLength: 500 },
    order: { type: 'integer', minimum: 0 },
  },
};

export const updateBannerSchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    title:    { type: 'string', minLength: 2, maxLength: 150 },
    link:     { type: 'string', maxLength: 500 },
    order:    { type: 'integer', minimum: 0 },
    isActive: { type: 'boolean' },
  },
};
