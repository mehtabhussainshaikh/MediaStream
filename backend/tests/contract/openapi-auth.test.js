import { openApiDocument } from '../../src/infrastructure/swagger/openapi.js';

describe('auth OpenAPI contract', () => {
  const cases = [
    ['post', '/api/v1/auth/register', ['201', '400', '409']],
    ['post', '/api/v1/auth/login', ['200', '400', '401', '429']],
    ['post', '/api/v1/auth/refresh', ['200', '401']],
    ['post', '/api/v1/auth/logout', ['200']],
    ['get', '/api/v1/auth/me', ['200', '401']],
  ];

  test.each(cases)('documents %s %s and its statuses', (method, path, statuses) => {
    const operation = openApiDocument.paths[path][method];
    expect(operation).toBeDefined();
    expect(Object.keys(operation.responses)).toEqual(expect.arrayContaining(statuses));
  });

  test('documents bearer and refresh-cookie authentication', () => {
    expect(openApiDocument.components.securitySchemes).toMatchObject({
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      refreshCookie: { type: 'apiKey', in: 'cookie', name: 'mediastream_refresh' },
    });
  });
});
