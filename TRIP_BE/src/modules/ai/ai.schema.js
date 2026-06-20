export const chatSchema = {
  type:                 'object',
  required:             ['message'],
  additionalProperties: false,
  properties: {
    message: {
      type:      'string',
      minLength: 1,
      maxLength: 1000,
    },
    // Frontend kirim full history tiap request (stateless di backend)
    conversationHistory: {
      type:     'array',
      maxItems: 20, // maks 10 pasang user-model
      items: {
        type:                 'object',
        required:             ['role', 'content'],
        additionalProperties: false,
        properties: {
          role:    { type: 'string', enum: ['user', 'model'] },
          content: { type: 'string', minLength: 1, maxLength: 5000 },
        },
      },
    },
  },
};
