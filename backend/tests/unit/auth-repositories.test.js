import { jest } from '@jest/globals';
import { createRefreshSessionRepository } from '../../src/features/auth/refresh-session.repository.js';
import { createUserRepository } from '../../src/features/users/user.repository.js';

function queryResult(value) {
  const query = {
    select: jest.fn(() => query),
    lean: jest.fn(async () => value),
  };
  return query;
}

describe('auth repositories', () => {
  test('creates users and never returns passwordHash', async () => {
    const model = {
      create: jest.fn(async (input) => ({ toObject: () => ({ _id: 'user-id', ...input }) })),
    };
    const repository = createUserRepository(model);
    const result = await repository.create({
      name: 'User', email: 'user@example.com', passwordHash: 'secret', role: 'user',
    });
    expect(result).toEqual({ _id: 'user-id', name: 'User', email: 'user@example.com', role: 'user' });
  });

  test('selects credentials explicitly and returns public users without hashes', async () => {
    const credentials = { _id: 'user-id', email: 'user@example.com', passwordHash: 'hash' };
    const credentialQuery = queryResult(credentials);
    const publicQuery = queryResult({ _id: 'user-id', email: 'user@example.com' });
    const model = {
      findOne: jest.fn(() => credentialQuery),
      findById: jest.fn(() => publicQuery),
    };
    const repository = createUserRepository(model);
    await expect(repository.findCredentialsByEmail('user@example.com')).resolves.toEqual(credentials);
    expect(credentialQuery.select).toHaveBeenCalledWith('+passwordHash');
    await expect(repository.findPublicById('user-id')).resolves.toEqual({
      _id: 'user-id', email: 'user@example.com',
    });
  });

  test('creates, atomically consumes, and idempotently revokes refresh sessions', async () => {
    const consumedSession = { userId: 'user-id', tokenHash: 'hash' };
    const consumeQuery = queryResult(consumedSession);
    const model = {
      create: jest.fn(async (input) => input),
      findOneAndUpdate: jest.fn(() => consumeQuery),
      updateOne: jest.fn(async () => ({ acknowledged: true })),
    };
    const repository = createRefreshSessionRepository(model);
    await repository.create({ userId: 'user-id', tokenHash: 'hash' });
    const now = new Date('2026-08-27T10:00:00.000Z');
    await expect(repository.consumeActive('hash', now)).resolves.toEqual(consumedSession);
    expect(model.findOneAndUpdate).toHaveBeenCalledWith(
      { tokenHash: 'hash', revokedAt: null, expiresAt: { $gt: now } },
      { $set: { revokedAt: now } },
      { new: false },
    );
    await repository.revoke('hash', now);
    expect(model.updateOne).toHaveBeenCalledWith(
      { tokenHash: 'hash', revokedAt: null }, { $set: { revokedAt: now } },
    );
  });
});

