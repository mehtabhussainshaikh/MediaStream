export const openApiDocument = Object.freeze({
  openapi: '3.0.3',
  info: {
    title: 'MediaStream Backend API',
    version: '1.0.0',
    description: 'Authenticated multimedia upload, metadata, search, and ranking API.',
  },
  servers: [{ url: '/', description: 'API root; feature endpoints use /api/v1' }],
  paths: {
    '/health': {
      get: {
        summary: 'Return service liveness and MongoDB readiness',
        tags: ['System'],
        responses: {
          200: {
            description: 'Service and MongoDB are ready',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
          503: {
            description: 'Service is live but MongoDB is not ready',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/api/v1/auth/register': {
      post: {
        tags: ['Authentication'], summary: 'Create a user account',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } } },
        responses: {
          201: { description: 'Account created', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          409: { description: 'Email already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/auth/login': {
      post: {
        tags: ['Authentication'], summary: 'Create an authenticated session',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } } },
        responses: {
          200: { description: 'Authenticated; refresh token is set as an HttpOnly cookie', headers: { 'Set-Cookie': { schema: { type: 'string' } } }, content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionResponse' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthenticated' },
          429: { description: 'Authentication rate limit exceeded', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Authentication'], summary: 'Rotate the refresh session', security: [{ refreshCookie: [] }],
        responses: {
          200: { description: 'Session rotated; a new refresh cookie is set', headers: { 'Set-Cookie': { schema: { type: 'string' } } }, content: { 'application/json': { schema: { $ref: '#/components/schemas/SessionResponse' } } } },
          401: { $ref: '#/components/responses/Unauthenticated' },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Authentication'], summary: 'Revoke the refresh session and clear its cookie', security: [{ refreshCookie: [] }],
        responses: {
          200: { description: 'Logout is complete or the session was already absent', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean', enum: [true] }, data: { type: 'object', properties: { loggedOut: { type: 'boolean', enum: [true] } } } } } } } },
        },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Authentication'], summary: 'Return the current user', security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/UserResponse' } } } },
          401: { $ref: '#/components/responses/Unauthenticated' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'mediastream_refresh' },
    },
    responses: {
      ValidationError: { description: 'Request validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      Unauthenticated: { description: 'Authentication failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
    },
    schemas: {
      User: {
        type: 'object', required: ['_id', 'name', 'email', 'role', 'createdAt', 'updatedAt'],
        properties: {
          _id: { type: 'string', example: '64b7f0f2c8d8a33e62f81234' },
          name: { type: 'string', minLength: 2, maxLength: 80 },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'admin'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      RegisterRequest: {
        type: 'object', additionalProperties: false, required: ['name', 'email', 'password'],
        properties: { name: { type: 'string', minLength: 2, maxLength: 80 }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password', minLength: 8, maxLength: 128 } },
      },
      LoginRequest: {
        type: 'object', additionalProperties: false, required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } },
      },
      UserResponse: {
        type: 'object', required: ['success', 'data'],
        properties: { success: { type: 'boolean', enum: [true] }, data: { type: 'object', required: ['user'], properties: { user: { $ref: '#/components/schemas/User' } } } },
      },
      SessionResponse: {
        type: 'object', required: ['success', 'data'],
        properties: {
          success: { type: 'boolean', enum: [true] },
          data: { type: 'object', required: ['user', 'accessToken', 'expiresInSeconds'], properties: { user: { $ref: '#/components/schemas/User' }, accessToken: { type: 'string', description: '15-minute JWT access token' }, expiresInSeconds: { type: 'integer', enum: [900] } } },
        },
      },
      HealthResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            required: ['status', 'database', 'uptimeSeconds'],
            properties: {
              status: { type: 'string', enum: ['ready', 'not_ready'] },
              database: { type: 'string', enum: ['connected', 'disconnected'] },
              uptimeSeconds: { type: 'number', minimum: 0 },
            },
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error', 'requestId'],
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
            },
          },
          requestId: { type: 'string', format: 'uuid' },
        },
      },
    },
  },
});
