import { jest } from '@jest/globals';
import { AppError } from '../../src/shared/app-error.js';
import { createApp } from '../../src/app/create-app.js';
import { withHttpServer } from '../helpers/http-server.js';

const ownerId = '507f1f77bcf86cd799439011';
const mediaId = '507f191e810c19729de860ea';
const record = { _id: mediaId, ownerId, title: 'Media', tags: [], publicId: 'provider-id', resourceType: 'image' };
const config = {
  nodeEnv: 'test', isProduction: false, frontendOrigin: 'http://localhost:5173', jsonBodyLimit: '10kb',
  refreshSessionTtlDays: 7, refreshCookieName: 'mediastream_refresh', cookieSameSite: 'lax',
  uploadLimitsBytes: { image: 1024, video: 2048, audio: 1024, pdf: 1024 },
  cloudinary: { cloudName: 'test', apiKey: 'test', apiSecret: 'test' },
};
const logger = { info: jest.fn(), error: jest.fn() };

function setup() {
  const service = {
    mine: jest.fn(async () => ({ items: [record], meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false } })),
    details: jest.fn(async () => record),
    update: jest.fn(async (_id, _user, metadata) => ({ ...record, ...metadata })),
    delete: jest.fn(async () => ({ id: mediaId, deleted: true })),
  };
  const authenticate = async (request, _response, next) => {
    if (request.get('authorization') !== 'Bearer valid-access') {
      throw new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'Access token is invalid or expired' });
    }
    request.user = { id: ownerId, role: request.get('x-test-role') || 'user' };
    next();
  };
  const authModule = { service: {}, authenticate };
  const app = createApp({
    config, database: { isReady: () => true }, logger, authModule,
    mediaUploadModule: { service: {} }, mediaCrudModule: { service },
  });
  return { app, service };
}

describe('media CRUD API', () => {
  const authorization = { Authorization: 'Bearer valid-access' };

  test('declares /mine before /:id and returns pagination metadata', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media/mine?page=1&limit=20`, { headers: authorization });
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.media).toEqual([record]);
      expect(body.meta.total).toBe(1);
      expect(service.mine).toHaveBeenCalledWith(ownerId, expect.objectContaining({
        q: undefined, type: undefined, tags: [], sort: 'newest', page: 1, limit: 20, skip: 0,
      }));
      expect(service.details).not.toHaveBeenCalled();
    });
  });

  test('accepts search and filters for the current owner', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media/mine?q=launch&type=image&tags=demo%2Cfeatured&sort=relevance`, { headers: authorization });
      expect(response.status).toBe(200);
      expect(service.mine).toHaveBeenCalledWith(ownerId, expect.objectContaining({
        q: 'launch', type: 'image', tags: ['demo', 'featured'], sort: 'relevance',
      }));
    });
  });

  test('returns details for an authenticated user', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media/${mediaId}`, { headers: authorization });
      expect(response.status).toBe(200);
      expect((await response.json()).data.media).toEqual(record);
      expect(service.details).toHaveBeenCalledWith(mediaId, { id: ownerId, role: 'user' });
    });
  });

  test('updates only normalized editable metadata', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media/${mediaId}`, {
        method: 'PATCH', headers: { ...authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: ' Updated ', tags: ['Demo', 'demo'] }),
      });
      expect(response.status).toBe(200);
      expect(service.update).toHaveBeenCalledWith(
        mediaId, { id: ownerId, role: 'user' }, { title: 'Updated', tags: ['demo'] },
      );
    });
  });

  test('deletes through the service and requires authentication', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      let response = await fetch(`${baseUrl}/api/v1/media/${mediaId}`, { method: 'DELETE' });
      expect(response.status).toBe(401);
      response = await fetch(`${baseUrl}/api/v1/media/${mediaId}`, { method: 'DELETE', headers: authorization });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ success: true, data: { id: mediaId, deleted: true } });
      expect(service.delete).toHaveBeenCalledWith(mediaId, { id: ownerId, role: 'user' });
    });
  });

  test('rejects malformed IDs and immutable-field updates before service calls', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      let response = await fetch(`${baseUrl}/api/v1/media/not-an-id`, { headers: authorization });
      expect(response.status).toBe(400);
      response = await fetch(`${baseUrl}/api/v1/media/${mediaId}`, {
        method: 'PATCH', headers: { ...authorization, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: 'forged' }),
      });
      expect(response.status).toBe(400);
      expect(service.update).not.toHaveBeenCalled();
    });
  });
});
