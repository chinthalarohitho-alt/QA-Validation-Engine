export const loginSchema = {
  type: 'object',
  required: ['id', 'username', 'email', 'accessToken', 'refreshToken'],
  properties: {
    id: { type: 'integer' },
    username: { type: 'string', minLength: 1 },
    email: { type: 'string', pattern: '@' },
    accessToken: { type: 'string', pattern: '^[\\w-]+\\.[\\w-]+\\.[\\w-]+$' },
    refreshToken: { type: 'string', minLength: 1 },
  },
};

export const currentUserSchema = {
  type: 'object',
  required: ['id', 'username', 'email', 'firstName', 'lastName'],
  properties: {
    id: { type: 'integer' },
    username: { type: 'string' },
    email: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
  },
};

export const errorSchema = {
  type: 'object',
  required: ['message'],
  properties: { message: { type: 'string', minLength: 1 } },
};
