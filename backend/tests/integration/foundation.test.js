import { jest } from '@jest/globals';
import { createApp } from '../../src/app/create-app.js';
import { withHttpServer } from '../helpers/http-server.js';

const config = {
  nodeEnv: 'test',
  isProduction: false,
  frontendOrigin: 'http://localhost:5173',
  jsonBodyLimit: '10kb',
};
const logger = { info: jest.fn(), error: jest.fn() };

function appWithDatabaseReady(isReady) {
  return createApp({
    config,
    database: { isReady: () => isReady },
    logger,
  });
}

describe('backend foundation', () => {
  beforeEach(() => jest.clearAllMocks());

  test('reports ready when MongoDB is connected', async () => {
    await withHttpServer(appWithDatabaseReady(true), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBeTruthy();
      expect(body).toMatchObject({
        success: true,
        data: { status: 'ready', database: 'connected' },
      });
    });
  });

  test('reports unavailable when MongoDB is disconnected', async () => {
    await withHttpServer(appWithDatabaseReady(false), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({
        success: true,
        data: { status: 'not_ready', database: 'disconnected' },
      });
    });
  });

  test('serves the OpenAPI contract', async () => {
    await withHttpServer(appWithDatabaseReady(true), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api-docs.json`);
      const body = await response.json();
      expect(response.status).toBe(200);
      expect(body.openapi).toBe('3.0.3');
      expect(body.paths['/health'].get.responses).toHaveProperty('200');
      expect(body.paths['/health'].get.responses).toHaveProperty('503');
    });
  });

  test('rejects an unconfigured browser origin', async () => {
    await withHttpServer(appWithDatabaseReady(true), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/health`, {
        headers: { Origin: 'https://untrusted.example' },
      });
      const body = await response.json();
      expect(response.status).toBe(403);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.requestId).toBeTruthy();
    });
  });

  test('returns the stable error envelope for unknown routes', async () => {
    await withHttpServer(appWithDatabaseReady(true), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/missing`);
      const body = await response.json();
      expect(response.status).toBe(404);
      expect(body).toMatchObject({
        success: false,
        error: {
          code: 'RESOURCE_NOT_FOUND',
          message: 'Requested resource was not found',
        },
      });
      expect(body.requestId).toBeTruthy();
    });
  });

  test('returns a validation error for malformed JSON', async () => {
    await withHttpServer(appWithDatabaseReady(true), async (baseUrl) => {
      const response = await fetch(`${baseUrl}/missing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid',
      });
      const body = await response.json();
      expect(response.status).toBe(400);
      expect(body.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Request body contains invalid JSON',
      });
    });
  });
});
