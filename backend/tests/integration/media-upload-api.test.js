import { jest } from '@jest/globals';
import { AppError } from '../../src/shared/app-error.js';
import { createApp } from '../../src/app/create-app.js';
import { withHttpServer } from '../helpers/http-server.js';

const userId = '507f1f77bcf86cd799439011';
const limits = { image: 1024, video: 2048, audio: 1024, pdf: 1024 };
const config = {
  nodeEnv: 'test', isProduction: false, frontendOrigin: 'http://localhost:5173', jsonBodyLimit: '10kb',
  refreshSessionTtlDays: 7, refreshCookieName: 'mediastream_refresh', cookieSameSite: 'lax',
  uploadLimitsBytes: limits, cloudinary: { cloudName: 'test', apiKey: 'test', apiSecret: 'test' },
};
const logger = { info: jest.fn(), error: jest.fn() };
const database = { isReady: () => true };

function setup() {
  const service = {
    upload: jest.fn(async ({ ownerId, file, metadata }) => ({
      _id: 'media-id', ownerId, title: metadata.title, description: metadata.description,
      tags: metadata.tags, originalName: file.originalname, mimeType: file.mimetype,
      extension: metadata.fileType.extension, sizeBytes: file.size,
      mediaType: metadata.fileType.mediaType, publicId: 'provider-id',
      resourceType: metadata.fileType.resourceType, secureUrl: 'https://res.cloudinary.com/test/file',
      format: metadata.fileType.extension, status: 'ready', viewCount: 0,
    })),
  };
  const authenticate = async (request, _response, next) => {
    if (request.get('authorization') !== 'Bearer valid-access') {
      throw new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'Access token is invalid or expired' });
    }
    request.user = { id: userId, role: 'user' };
    next();
  };
  const authModule = { service: {}, authenticate };
  const app = createApp({ config, database, logger, authModule, mediaUploadModule: { service } });
  return { app, service };
}

function imageForm() {
  const form = new FormData();
  form.set('title', ' Demo image ');
  form.set('description', ' Preview ');
  form.set('tags', 'Demo,MEDIA,demo');
  form.set('file', new Blob([Buffer.from('image-bytes')], { type: 'image/jpeg' }), 'photo.jpg');
  return form;
}

describe('media upload API', () => {
  test('requires access-token authentication before multipart processing', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media`, { method: 'POST', body: imageForm() });
      expect(response.status).toBe(401);
      expect(service.upload).not.toHaveBeenCalled();
    });
  });

  test('accepts one supported file and normalized metadata', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/media`, {
        method: 'POST', headers: { Authorization: 'Bearer valid-access' }, body: imageForm(),
      });
      expect(response.status).toBe(201);
      expect((await response.json()).data.media).toMatchObject({
        ownerId: userId, title: 'Demo image', tags: ['demo', 'media'], mediaType: 'image',
      });
      expect(service.upload).toHaveBeenCalledWith(expect.objectContaining({ ownerId: userId }));
    });
  });

  test('rejects missing, unsupported, and multiple files with stable errors', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const headers = { Authorization: 'Bearer valid-access' };
      const missing = new FormData();
      missing.set('title', 'Missing file');
      let response = await fetch(`${baseUrl}/api/v1/media`, { method: 'POST', headers, body: missing });
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe('VALIDATION_ERROR');

      const unsupported = new FormData();
      unsupported.set('title', 'Text file');
      unsupported.set('file', new Blob(['text'], { type: 'text/plain' }), 'file.txt');
      response = await fetch(`${baseUrl}/api/v1/media`, { method: 'POST', headers, body: unsupported });
      expect(response.status).toBe(415);
      expect((await response.json()).error.code).toBe('UNSUPPORTED_MEDIA');

      const multiple = imageForm();
      multiple.append('file', new Blob(['second'], { type: 'image/png' }), 'second.png');
      response = await fetch(`${baseUrl}/api/v1/media`, { method: 'POST', headers, body: multiple });
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
      expect(service.upload).not.toHaveBeenCalled();
    });
  });
});

