import { jest } from '@jest/globals';
import { createAuthService } from '../../src/features/auth/auth.service.js';
import { hashPassword } from '../../src/features/auth/password.js';

const now = new Date('2026-08-27T10:00:00.000Z');
const user = { _id: '507f1f77bcf86cd799439011', name: 'Media User', email: 'user@example.com', role: 'user' };

function setup(overrides = {}) {
  const users = {
    create: jest.fn(async (input) => ({ ...user, name: input.name, email: input.email })),
    findCredentialsByEmail: jest.fn(),
    findPublicById: jest.fn(async () => user),
    ...overrides.users,
  };
  const sessions = {
    create: jest.fn(async () => ({})),
    consumeActive: jest.fn(),
    revoke: jest.fn(async () => {}),
    ...overrides.sessions,
  };
  const tokens = {
    createRefreshToken: jest.fn(() => 'raw-refresh-token'),
    hashRefreshToken: jest.fn((value) => `hash:${value}`),
    createAccessToken: jest.fn(() => 'access-token'),
  };
  const service = createAuthService({
    users, sessions, tokens, refreshSessionTtlDays: 7, clock: () => now,
  });
  return { service, users, sessions, tokens };
}

describe('auth service', () => {
  test('registers a user with a password hash and maps duplicate emails', async () => {
    const { service, users } = setup();
    await expect(service.register({ name: 'Media User', email: 'user@example.com', password: 'password123' }))
      .resolves.toMatchObject(user);
    expect(users.create.mock.calls[0][0].passwordHash).not.toContain('password123');

    users.create.mockRejectedValueOnce(Object.assign(new Error('duplicate'), { code: 11000 }));
    await expect(service.register({ name: 'Media User', email: 'user@example.com', password: 'password123' }))
      .rejects.toMatchObject({ status: 409, code: 'EMAIL_EXISTS' });
  });

  test('uses the same generic response for missing users and wrong passwords', async () => {
    const { service, users } = setup();
    users.findCredentialsByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'none@example.com', password: 'password123' }, {}))
      .rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED', message: 'Invalid email or password' });

    users.findCredentialsByEmail.mockResolvedValue({ ...user, passwordHash: await hashPassword('correct-password') });
    await expect(service.login({ email: user.email, password: 'wrong-password' }, {}))
      .rejects.toMatchObject({ status: 401, message: 'Invalid email or password' });
  });

  test('creates a login session without returning the password hash', async () => {
    const { service, users, sessions } = setup();
    users.findCredentialsByEmail.mockResolvedValue({ ...user, passwordHash: await hashPassword('correct-password') });
    await expect(service.login({ email: user.email, password: 'correct-password' }, {
      userAgent: 'Jest', ipAddress: '127.0.0.1',
    })).resolves.toEqual({ user, accessToken: 'access-token', refreshToken: 'raw-refresh-token', expiresInSeconds: 900 });
    expect(sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      userId: user._id,
      tokenHash: 'hash:raw-refresh-token',
      expiresAt: new Date('2026-09-03T10:00:00.000Z'),
      userAgent: 'Jest',
      ipAddress: '127.0.0.1',
    }));
  });

  test('atomically consumes and rotates an active refresh session', async () => {
    const { service, sessions } = setup();
    sessions.consumeActive.mockResolvedValue({ userId: user._id });
    await expect(service.refresh('old-token', {})).resolves.toMatchObject({
      accessToken: 'access-token', refreshToken: 'raw-refresh-token',
    });
    expect(sessions.consumeActive).toHaveBeenCalledWith('hash:old-token', now);

    sessions.consumeActive.mockResolvedValueOnce(null);
    await expect(service.refresh('replayed-token', {})).rejects.toMatchObject({
      status: 401, message: 'Refresh session is invalid or expired',
    });
  });

  test('logout is idempotent with or without a token', async () => {
    const { service, sessions } = setup();
    await service.logout(undefined);
    expect(sessions.revoke).not.toHaveBeenCalled();
    await service.logout('refresh-token');
    expect(sessions.revoke).toHaveBeenCalledWith('hash:refresh-token', now);
  });

  test('rejects refresh and current-user access when the user no longer exists', async () => {
    const { service, users, sessions } = setup();
    users.findPublicById.mockResolvedValue(null);
    sessions.consumeActive.mockResolvedValue({ userId: user._id });
    await expect(service.refresh('refresh-token', {})).rejects.toMatchObject({
      status: 401, code: 'UNAUTHENTICATED',
    });
    await expect(service.currentUser(user._id)).rejects.toMatchObject({
      status: 401, code: 'UNAUTHENTICATED',
    });
  });
});
