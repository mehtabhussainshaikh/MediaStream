import { jest } from '@jest/globals';
import { AppError } from '../../src/shared/app-error.js';
import { createApp } from '../../src/app/create-app.js';
import { withHttpServer } from '../helpers/http-server.js';

const userId = '507f1f77bcf86cd799439011';
const mediaId = '507f191e810c19729de860ea';
const record = { _id: mediaId, title: 'Launch video', viewCount: 3 };
const config = {
  nodeEnv: 'test', isProduction: false, frontendOrigin: 'http://localhost:5173', jsonBodyLimit: '10kb',
  refreshSessionTtlDays: 7, refreshCookieName: 'mediastream_refresh', cookieSameSite: 'lax',
  uploadLimitsBytes: { image: 1024, video: 2048, audio: 1024, pdf: 1024 },
  cloudinary: { cloudName: 'test', apiKey: 'test', apiSecret: 'test' },
};

function setup() {
  const service = {
    search: jest.fn(async () => ({
      items: [record], meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    })),
    incrementView: jest.fn(async () => ({ ...record, viewCount: 4 })),
  };
  const authenticate = async (request, _response, next) => {
    if (request.get('authorization') !== 'Bearer valid-access') {
      throw new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'Access token is invalid or expired' });
    }
    request.user = { id: userId, role: 'user' };
    next();
  };
  const app = createApp({
    config, database: { isReady: () => true }, logger: { info: jest.fn(), error: jest.fn() },
    authModule: { service: {}, authenticate }, mediaUploadModule: { service: {} },
    mediaCrudModule: { service: {} }, mediaSearchModule: { service },
  });
  return { app, service };
}

describe('media search API', () => {
  const authorization = { Authorization: 'Bearer valid-access' };

  test('requires authentication for search', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media?q=launch`);
      expect(response.status).toBe(401);
      expect(service.search).not.toHaveBeenCalled();
    });
  });

  test('validates and normalizes search filters', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(
        `${baseUrl}/api/v1/media?q=launch&type=video&tags=Demo%2Cfeatured&from=2026-01-01&to=2026-01-31&page=1&limit=20`,
        { headers: authorization },
      );
      expect(response.status).toBe(200);
      expect((await response.json()).meta.total).toBe(1);
      expect(service.search).toHaveBeenCalledWith(expect.objectContaining({
        q: 'launch', type: 'video', tags: ['demo', 'featured'], sort: 'relevance', page: 1, limit: 20,
      }), { id: userId, role: 'user' });
    });
  });

  test('rejects invalid sort combinations before querying', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media?q=launch&sort=mostViewed`, { headers: authorization });
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
      expect(service.search).not.toHaveBeenCalled();
    });
  });

  test('increments view count through the dedicated route', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media/${mediaId}/view`, {
        method: 'POST', headers: authorization,
      });
      expect(response.status).toBe(200);
      expect((await response.json()).data.media.viewCount).toBe(4);
      expect(service.incrementView).toHaveBeenCalledWith(mediaId, { id: userId, role: 'user' });
    });
  });
});
