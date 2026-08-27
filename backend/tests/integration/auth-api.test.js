import { jest } from '@jest/globals';
import { AppError } from '../../src/shared/app-error.js';
import { createApp } from '../../src/app/create-app.js';
import { withHttpServer } from '../helpers/http-server.js';

const user = { _id: '507f1f77bcf86cd799439011', name: 'Media User', email: 'user@example.com', role: 'user' };
const config = {
  nodeEnv: 'test', isProduction: false, frontendOrigin: 'http://localhost:5173', jsonBodyLimit: '10kb',
  refreshSessionTtlDays: 7, refreshCookieName: 'mediastream_refresh', cookieSameSite: 'lax',
  cloudinary: { cloudName: 'test', apiKey: 'test', apiSecret: 'test' },
  uploadLimitsBytes: { image: 10_485_760, video: 104_857_600, audio: 26_214_400, pdf: 20_971_520 },
};
const logger = { info: jest.fn(), error: jest.fn() };
const database = { isReady: () => true };

function setup() {
  const service = {
    register: jest.fn(async () => user),
    login: jest.fn(async () => ({ user, accessToken: 'access-token', refreshToken: 'new-refresh', expiresInSeconds: 900 })),
    refresh: jest.fn(async () => ({ user, accessToken: 'rotated-access', refreshToken: 'rotated-refresh', expiresInSeconds: 900 })),
    logout: jest.fn(async () => {}),
    currentUser: jest.fn(async () => user),
  };
  const authenticate = async (request, _response, next) => {
    if (request.get('authorization') !== 'Bearer valid-access') {
      throw new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'Access token is invalid or expired' });
    }
    request.user = { id: user._id, role: user.role };
    next();
  };
  return { app: createApp({ config, database, logger, authModule: { service, authenticate } }), service };
}

describe('authentication API', () => {
  test('registers normalized input without exposing password', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ' Media User ', email: ' USER@EXAMPLE.COM ', password: 'password123' }),
      });
      expect(response.status).toBe(201);
      expect((await response.json()).data.user).toEqual(user);
      expect(service.register).toHaveBeenCalledWith({ name: 'Media User', email: 'user@example.com', password: 'password123' });
    });
  });

  test('logs in and sets the protected refresh cookie', async () => {
    const { app } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: 'password123' }),
      });
      expect(response.status).toBe(200);
      const cookie = response.headers.get('set-cookie');
      expect(cookie).toContain('mediastream_refresh=new-refresh');
      expect(cookie).toContain('Path=/api/v1/auth');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect((await response.json()).data).toMatchObject({ accessToken: 'access-token', expiresInSeconds: 900 });
    });
  });

  test('rotates the refresh cookie and rejects an absent access token for me', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const refresh = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST', headers: { Cookie: 'mediastream_refresh=old-refresh' },
      });
      expect(refresh.status).toBe(200);
      expect(service.refresh).toHaveBeenCalledWith('old-refresh', expect.any(Object));
      expect(refresh.headers.get('set-cookie')).toContain('rotated-refresh');

      const rejected = await fetch(`${baseUrl}/api/v1/auth/me`);
      expect(rejected.status).toBe(401);
      const accepted = await fetch(`${baseUrl}/api/v1/auth/me`, { headers: { Authorization: 'Bearer valid-access' } });
      expect(accepted.status).toBe(200);
      expect((await accepted.json()).data.user).toEqual(user);
    });
  });

  test('logout is idempotent and clears the refresh cookie', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST', headers: { Cookie: 'mediastream_refresh=old-refresh' },
      });
      expect(response.status).toBe(200);
      expect(service.logout).toHaveBeenCalledWith('old-refresh');
      expect(response.headers.get('set-cookie')).toMatch(/mediastream_refresh=;.*Expires=/i);
      expect(await response.json()).toEqual({ success: true, data: { loggedOut: true } });
    });
  });

  test('returns validation details without calling the service', async () => {
    const { app, service } = setup();
    await withHttpServer(app, async (baseUrl) => {
      const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
      });
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
      expect(service.register).not.toHaveBeenCalled();
    });
  });
});
