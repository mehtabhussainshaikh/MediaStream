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
    '/api/v1/media': {
      post: {
        tags: ['Media'], summary: 'Upload one image, video, audio, or PDF', security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object', additionalProperties: false, required: ['file', 'title'],
                properties: {
                  file: { type: 'string', format: 'binary', description: 'One supported media file' },
                  title: { type: 'string', minLength: 2, maxLength: 120 },
                  description: { type: 'string', maxLength: 2000 },
                  tags: { type: 'string', description: 'Comma-separated tags; maximum 10 unique tags, 30 characters each' },
                },
              },
              encoding: { file: { contentType: 'image/jpeg, image/png, image/webp, image/gif, video/mp4, video/webm, video/quicktime, audio/mpeg, audio/wav, audio/ogg, audio/mp4, application/pdf' } },
            },
          },
        },
        responses: {
          201: { description: 'Media uploaded and metadata persisted', content: { 'application/json': { schema: { $ref: '#/components/schemas/MediaResponse' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthenticated' },
          413: { description: 'File exceeds its media-type limit', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          415: { description: 'File MIME type is unsupported', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Metadata persistence failed after provider compensation', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          502: { description: 'Cloudinary operation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
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
        example: { name: 'Media User', email: 'user@example.com', password: 'secure-password' },
      },
      LoginRequest: {
        type: 'object', additionalProperties: false, required: ['email', 'password'],
        properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } },
        example: { email: 'user@example.com', password: 'secure-password' },
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
      Media: {
        type: 'object',
        required: ['_id', 'ownerId', 'title', 'tags', 'originalName', 'mimeType', 'extension', 'sizeBytes', 'mediaType', 'publicId', 'resourceType', 'secureUrl', 'format', 'status', 'viewCount', 'createdAt', 'updatedAt'],
        properties: {
          _id: { type: 'string' }, ownerId: { type: 'string' }, title: { type: 'string' }, description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }, originalName: { type: 'string' }, mimeType: { type: 'string' }, extension: { type: 'string' },
          sizeBytes: { type: 'integer', minimum: 1 }, mediaType: { type: 'string', enum: ['image', 'video', 'audio', 'pdf'] },
          publicId: { type: 'string' }, resourceType: { type: 'string', enum: ['image', 'video', 'raw'] }, secureUrl: { type: 'string', format: 'uri' }, format: { type: 'string' },
          dimensions: { type: 'object', properties: { width: { type: 'integer' }, height: { type: 'integer' } } }, duration: { type: 'number', minimum: 0 },
          status: { type: 'string', enum: ['uploading', 'ready', 'failed'] }, viewCount: { type: 'integer', minimum: 0 },
          createdAt: { type: 'string', format: 'date-time' }, updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      MediaResponse: {
        type: 'object', required: ['success', 'data'],
        properties: { success: { type: 'boolean', enum: [true] }, data: { type: 'object', required: ['media'], properties: { media: { $ref: '#/components/schemas/Media' } } } },
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
