import { jest } from '@jest/globals';
import { createAuthenticate } from '../../src/features/auth/auth.middleware.js';

const user = { _id: '507f1f77bcf86cd799439011', role: 'user' };

function requestWithAuthorization(authorization) {
  return {
    get: jest.fn(() => authorization),
    user: undefined,
  };
}

describe('access-token middleware', () => {
  test('attaches the current user for a valid token', async () => {
    const tokens = { verifyAccessToken: jest.fn(() => ({ sub: user._id })) };
    const users = { findPublicById: jest.fn(async () => user) };
    const authenticate = createAuthenticate({ tokens, users });
    const request = requestWithAuthorization('Bearer valid');
    const next = jest.fn();
    await authenticate(request, {}, next);
    expect(request.user).toEqual({ id: user._id, role: 'user' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  test.each([undefined, '', 'Basic token', 'Bearer'])('rejects missing or malformed authorization: %s', async (header) => {
    const authenticate = createAuthenticate({ tokens: {}, users: {} });
    await expect(authenticate(requestWithAuthorization(header), {}, jest.fn()))
      .rejects.toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
  });

  test('maps invalid, expired, and missing-user tokens to the same safe response', async () => {
    const invalid = createAuthenticate({
      tokens: { verifyAccessToken: jest.fn(() => { throw new Error('expired'); }) },
      users: { findPublicById: jest.fn() },
    });
    await expect(invalid(requestWithAuthorization('Bearer expired'), {}, jest.fn()))
      .rejects.toMatchObject({ status: 401, message: 'Access token is invalid or expired' });

    const missingUser = createAuthenticate({
      tokens: { verifyAccessToken: jest.fn(() => ({ sub: user._id })) },
      users: { findPublicById: jest.fn(async () => null) },
    });
    await expect(missingUser(requestWithAuthorization('Bearer valid'), {}, jest.fn()))
      .rejects.toMatchObject({ status: 401, message: 'Access token is invalid or expired' });
  });
});

