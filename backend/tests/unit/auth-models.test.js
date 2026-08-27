import { RefreshSession } from '../../src/features/auth/refresh-session.model.js';
import { User } from '../../src/features/users/user.model.js';

function findIndex(indexes, field) {
  return indexes.find(([keys]) => keys[field] === 1);
}

describe('auth Mongoose models', () => {
  test('defines the required user constraints and unique email index', () => {
    const emailIndex = findIndex(User.schema.indexes(), 'email');
    expect(emailIndex[1].unique).toBe(true);
    expect(User.schema.path('passwordHash').options.select).toBe(false);
    expect(User.schema.path('role').options).toMatchObject({ enum: ['user', 'admin'], default: 'user' });
  });

  test('defines hashed-token, user, and TTL session indexes', () => {
    const indexes = RefreshSession.schema.indexes();
    expect(findIndex(indexes, 'userId')).toBeDefined();
    expect(findIndex(indexes, 'tokenHash')[1].unique).toBe(true);
    expect(findIndex(indexes, 'expiresAt')[1].expireAfterSeconds).toBe(0);
    expect(RefreshSession.schema.path('tokenHash').options.select).toBe(false);
  });
});
