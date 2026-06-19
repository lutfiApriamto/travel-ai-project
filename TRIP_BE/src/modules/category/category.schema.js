export const createCategorySchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name:        { type: 'string', minLength: 2, maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    sortOrder:   { type: 'integer', minimum: 0 },
  },
};

export const updateCategorySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name:        { type: 'string', minLength: 2, maxLength: 100 },
    description: { type: 'string', maxLength: 500 },
    status:      { type: 'string', enum: ['active', 'inactive'] },
    sortOrder:   { type: 'integer', minimum: 0 },
  },
};
