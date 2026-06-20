export const submitRefundSchema = {
  type: 'object',
  required: ['orderId', 'reason'],
  additionalProperties: false,
  properties: {
    orderId: { type: 'string', minLength: 1 },
    reason:  { type: 'string', minLength: 10, maxLength: 1000 },
  },
};

export const rejectRefundSchema = {
  type: 'object',
  required: ['rejectionReason'],
  additionalProperties: false,
  properties: {
    rejectionReason: { type: 'string', minLength: 5, maxLength: 500 },
  },
};

const ruleSchema = {
  type: 'object',
  required: ['minDaysBeforeDeparture', 'refundPercentage', 'description'],
  additionalProperties: false,
  properties: {
    minDaysBeforeDeparture: { type: 'integer', minimum: 0 },
    maxDaysBeforeDeparture: { anyOf: [{ type: 'integer', minimum: 0 }, { type: 'null' }] },
    refundPercentage:       { type: 'number', minimum: 0, maximum: 100 },
    description:            { type: 'string', minLength: 1, maxLength: 200 },
  },
};

export const updatePolicySchema = {
  type: 'object',
  required: ['rules'],
  additionalProperties: false,
  properties: {
    rules: { type: 'array', items: ruleSchema, minItems: 1 },
  },
};
