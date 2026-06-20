export const checkinSchema = {
  type: 'object',
  required: ['ticketCode'],
  additionalProperties: false,
  properties: {
    ticketCode: { type: 'string', minLength: 1 },
  },
};
