export const deleteImageSchema = {
  type: 'object',
  required: ['url'],
  additionalProperties: false,
  properties: {
    url: { type: 'string', minLength: 1 },
  },
};

export const deleteImagesSchema = {
  type: 'object',
  required: ['urls'],
  additionalProperties: false,
  properties: {
    urls: {
      type:     'array',
      items:    { type: 'string', minLength: 1 },
      minItems: 1,
      maxItems: 50,
    },
  },
};
