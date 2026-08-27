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

  test('documents authenticated multipart media upload and mandatory outcomes', () => {
    const operation = openApiDocument.paths['/api/v1/media'].post;
    expect(operation.security).toEqual([{ bearerAuth: [] }]);
    expect(operation.requestBody.content).toHaveProperty('multipart/form-data');
    expect(Object.keys(operation.responses)).toEqual(expect.arrayContaining([
      '201', '400', '401', '413', '415', '500', '502',
    ]));
  });

  test('documents owner listing, details, metadata updates, and deletion', () => {
    const mine = openApiDocument.paths['/api/v1/media/mine'].get;
    expect(mine.security).toEqual([{ bearerAuth: [] }]);
    expect(Object.keys(mine.responses)).toEqual(expect.arrayContaining(['200', '400', '401']));

    const item = openApiDocument.paths['/api/v1/media/{id}'];
    expect(Object.keys(item.get.responses)).toEqual(expect.arrayContaining(['200', '400', '401', '404']));
    expect(Object.keys(item.patch.responses)).toEqual(expect.arrayContaining(['200', '400', '401', '403', '404']));
    expect(Object.keys(item.delete.responses)).toEqual(expect.arrayContaining(['200', '400', '401', '403', '404', '502']));
    expect(item.patch.requestBody.content['application/json'].schema)
      .toEqual({ $ref: '#/components/schemas/MediaMetadataPatch' });
  });
});
