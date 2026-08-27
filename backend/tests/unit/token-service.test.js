import { createTokenService } from '../../src/features/auth/token.service.js';

describe('token service', () => {
  const service = createTokenService({
    accessSecret: 'test-secret-that-is-at-least-32-characters',
    accessTtl: '15m',
  });

  test('creates and verifies an HS256 access token', () => {
    const token = service.createAccessToken({ _id: '507f1f77bcf86cd799439011', role: 'user' });
    expect(service.verifyAccessToken(token)).toMatchObject({
      sub: '507f1f77bcf86cd799439011', role: 'user',
    });
  });

  test('creates random refresh tokens and deterministic hashes', () => {
    const first = service.createRefreshToken();
    const second = service.createRefreshToken();
    expect(first).toHaveLength(64);
    expect(second).not.toBe(first);
    expect(service.hashRefreshToken(first)).toHaveLength(64);
    expect(service.hashRefreshToken(first)).toBe(service.hashRefreshToken(first));
  });
});

