export const broadcastSchema = {
  type: 'object',
  required: ['title', 'message'],
  additionalProperties: false,
  properties: {
    title: {
      type:      'string',
      minLength: 3,
      maxLength: 150,
    },
    message: {
      type:      'string',
      minLength: 3,
      maxLength: 1000,
    },
    // opsional — array userId target. kosong = kirim ke semua user
    targetUserIds: {
      type:     'array',
      items:    { type: 'string' },
      nullable: true,
    },
  },
};
