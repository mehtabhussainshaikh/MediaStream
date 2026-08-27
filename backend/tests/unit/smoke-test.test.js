import { jest } from '@jest/globals';
import { runSmokeTest } from '../../scripts/smoke-test.js';

function response(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe('deployment smoke test', () => {
  test('verifies health readiness and the OpenAPI document', async () => {
    const fetchImplementation = jest.fn()
      .mockResolvedValueOnce(response(200, { success: true, data: { status: 'ready', database: 'connected' } }))
      .mockResolvedValueOnce(response(200, { openapi: '3.0.3', paths: { '/health': {}, '/api/v1/media': {} } }));
    await expect(runSmokeTest({ baseUrl: 'https://api.example.com/', fetchImplementation })).resolves.toEqual({
      baseUrl: 'https://api.example.com', database: 'connected', openApiVersion: '3.0.3', documentedPaths: 2,
    });
  });

  test('fails closed on missing URL, unavailable health, or invalid docs', async () => {
    await expect(runSmokeTest({ baseUrl: '' })).rejects.toThrow('SMOKE_BASE_URL is required');
    await expect(runSmokeTest({
      baseUrl: 'https://api.example.com',
      fetchImplementation: jest.fn().mockResolvedValue(response(503, { success: true, data: { status: 'not_ready' } })),
    })).rejects.toThrow('Health check failed');
    await expect(runSmokeTest({
      baseUrl: 'https://api.example.com',
      fetchImplementation: jest.fn()
        .mockResolvedValueOnce(response(200, { success: true, data: { status: 'ready' } }))
        .mockResolvedValueOnce(response(200, { openapi: '2.0', paths: {} })),
    })).rejects.toThrow('OpenAPI check failed');
  });
});
