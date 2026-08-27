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
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
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
