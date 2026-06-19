const HEX_COLOR_PATTERN = '^#[0-9A-Fa-f]{6}$';

export const createTagSchema = {
  type: 'object',
  required: ['name'],
  additionalProperties: false,
  properties: {
    name:  { type: 'string', minLength: 2, maxLength: 50 },
    color: { type: 'string', pattern: HEX_COLOR_PATTERN },
  },
};

export const updateTagSchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name:   { type: 'string', minLength: 2, maxLength: 50 },
    color:  { type: 'string', pattern: HEX_COLOR_PATTERN },
    status: { type: 'string', enum: ['active', 'inactive'] },
  },
};
