// ─── Province ─────────────────────────────────────────────────────────────────

export const createProvinceSchema = {
  type: 'object',
  required: ['id', 'name'],
  additionalProperties: false,
  properties: {
    id:   { type: 'string', minLength: 1, maxLength: 20 },
    name: { type: 'string', minLength: 2, maxLength: 100 },
  },
};

export const updateProvinceSchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name: { type: 'string', minLength: 2, maxLength: 100 },
  },
};

// ─── Regency ──────────────────────────────────────────────────────────────────

export const createRegencySchema = {
  type: 'object',
  required: ['id', 'province_id', 'name'],
  additionalProperties: false,
  properties: {
    id:          { type: 'string', minLength: 1, maxLength: 20 },
    province_id: { type: 'string', minLength: 1, maxLength: 20 },
    name:        { type: 'string', minLength: 2, maxLength: 100 },
  },
};

export const updateRegencySchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name:        { type: 'string', minLength: 2, maxLength: 100 },
    province_id: { type: 'string', minLength: 1, maxLength: 20 },
  },
};

// ─── District ─────────────────────────────────────────────────────────────────

export const createDistrictSchema = {
  type: 'object',
  required: ['id', 'regency_id', 'name'],
  additionalProperties: false,
  properties: {
    id:         { type: 'string', minLength: 1, maxLength: 20 },
    regency_id: { type: 'string', minLength: 1, maxLength: 20 },
    name:       { type: 'string', minLength: 2, maxLength: 100 },
  },
};

export const updateDistrictSchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name:       { type: 'string', minLength: 2, maxLength: 100 },
    regency_id: { type: 'string', minLength: 1, maxLength: 20 },
  },
};

// ─── Village ──────────────────────────────────────────────────────────────────

export const createVillageSchema = {
  type: 'object',
  required: ['id', 'district_id', 'name'],
  additionalProperties: false,
  properties: {
    id:          { type: 'string', minLength: 1, maxLength: 20 },
    district_id: { type: 'string', minLength: 1, maxLength: 20 },
    name:        { type: 'string', minLength: 2, maxLength: 100 },
  },
};

export const updateVillageSchema = {
  type: 'object',
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name:        { type: 'string', minLength: 2, maxLength: 100 },
    district_id: { type: 'string', minLength: 1, maxLength: 20 },
  },
};
