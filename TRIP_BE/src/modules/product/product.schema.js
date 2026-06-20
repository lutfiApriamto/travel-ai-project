const itineraryItemSchema = {
  type: 'object',
  required: ['day', 'title', 'activities'],
  additionalProperties: false,
  properties: {
    day:        { type: 'integer', minimum: 1 },
    title:      { type: 'string', minLength: 1, maxLength: 200 },
    activities: { type: 'string', minLength: 1 },
    hotel:      { type: 'string', maxLength: 200 },
    meals: {
      type: 'object',
      additionalProperties: false,
      properties: {
        breakfast: { type: 'boolean' },
        lunch:     { type: 'boolean' },
        dinner:    { type: 'boolean' },
      },
    },
  },
};

const addOnItemSchema = {
  type: 'object',
  required: ['name', 'price'],
  additionalProperties: false,
  properties: {
    name:  { type: 'string', minLength: 1, maxLength: 100 },
    price: { type: 'number', minimum: 0 },
  },
};

const sharedProperties = {
  name:             { type: 'string', minLength: 2, maxLength: 200 },
  categories:       { type: 'array', items: { type: 'string', minLength: 1 }, maxItems: 10 },
  types:            { type: 'array', items: { type: 'string', minLength: 1 }, maxItems: 10 },
  tags:             { type: 'array', items: { type: 'string', minLength: 1 }, maxItems: 20 },
  shortDescription: { type: 'string', maxLength: 300 },
  description:      { type: 'string' },
  thumbnail:        { type: 'string', minLength: 1 },
  gallery:          { type: 'array', items: { type: 'string', minLength: 1 }, maxItems: 20 },
  departureCity:    { type: 'string', maxLength: 100 },
  destinations:     { type: 'array', items: { type: 'string', minLength: 1 }, maxItems: 20 },
  departureDate:    { type: 'string', minLength: 1 },
  returnDate:       { type: 'string', minLength: 1 },
  meetingPoint:     { type: 'string', maxLength: 300 },
  price:            { type: 'number', minimum: 0 },
  quota:            { type: 'integer', minimum: 1 },
  minParticipants:  { type: 'integer', minimum: 1 },
  itinerary:        { type: 'array', items: itineraryItemSchema },
  includes:         { type: 'array', items: { type: 'string', minLength: 1 } },
  excludes:         { type: 'array', items: { type: 'string', minLength: 1 } },
  addOns:           { type: 'array', items: addOnItemSchema },
  terms:            { type: 'string' },
};

export const createProductSchema = {
  type: 'object',
  required: ['name', 'departureDate', 'returnDate', 'price', 'quota'],
  additionalProperties: false,
  properties: sharedProperties,
};

export const updateProductSchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    ...sharedProperties,
    thumbnail: { anyOf: [{ type: 'string', minLength: 1 }, { type: 'null' }] },
    status:    { type: 'string', enum: ['draft', 'active', 'cancelled'] },
  },
};

export const bulkStatusSchema = {
  type: 'object',
  required: ['ids', 'status'],
  additionalProperties: false,
  properties: {
    ids:    { type: 'array', items: { type: 'string', minLength: 1 }, minItems: 1, maxItems: 50 },
    status: { type: 'string', enum: ['draft', 'active', 'cancelled'] },
  },
};
