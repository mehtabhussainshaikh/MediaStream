import { openApiDocument } from '../../src/infrastructure/swagger/openapi.js';

const HTTP_METHODS = new Set(['get', 'post', 'patch', 'delete', 'put']);

describe('OpenAPI quality gate', () => {
  const operations = Object.entries(openApiDocument.paths).flatMap(([path, pathItem]) =>
    Object.entries(pathItem)
      .filter(([method]) => HTTP_METHODS.has(method))
      .map(([method, operation]) => ({ path, method, operation })),
  );

  test('publishes the expected version, identity, and API root', () => {
    expect(openApiDocument).toMatchObject({
      openapi: '3.0.3',
      info: { title: 'MediaStream Backend API', version: '1.0.0' },
      servers: [{ url: '/', description: expect.any(String) }],
    });
  });

  test.each(operations)('$method $path has summary, tags, and response contracts', ({ operation }) => {
    expect(operation.summary).toEqual(expect.any(String));
    expect(operation.tags).toEqual(expect.arrayContaining([expect.any(String)]));
    expect(Object.keys(operation.responses).length).toBeGreaterThan(0);
  });

  test('documents every mandatory runtime endpoint', () => {
    expect(openApiDocument.paths).toEqual(expect.objectContaining({
      '/health': expect.any(Object),
      '/api/v1/auth/register': expect.any(Object),
      '/api/v1/auth/login': expect.any(Object),
      '/api/v1/auth/refresh': expect.any(Object),
      '/api/v1/auth/logout': expect.any(Object),
      '/api/v1/auth/me': expect.any(Object),
      '/api/v1/media': expect.any(Object),
      '/api/v1/media/mine': expect.any(Object),
      '/api/v1/media/{id}': expect.any(Object),
      '/api/v1/media/{id}/view': expect.any(Object),
    }));
  });

  test('contains reusable success, error, media, pagination, and security definitions', () => {
    expect(openApiDocument.components.securitySchemes).toEqual(expect.objectContaining({
      bearerAuth: expect.any(Object), refreshCookie: expect.any(Object),
    }));
    expect(openApiDocument.components.schemas).toEqual(expect.objectContaining({
      User: expect.any(Object), Media: expect.any(Object), ErrorResponse: expect.any(Object),
      MediaListResponse: expect.any(Object), PaginationMeta: expect.any(Object),
    }));
  });
});
