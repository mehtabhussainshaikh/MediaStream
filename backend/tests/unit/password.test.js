import { hashPassword, verifyPassword } from '../../src/features/auth/password.js';

describe('password hashing', () => {
  test('creates salted hashes and verifies only the correct password', async () => {
    const first = await hashPassword('StrongPassword1');
    const second = await hashPassword('StrongPassword1');
    expect(first).not.toBe(second);
    expect(first).not.toContain('StrongPassword1');
    await expect(verifyPassword('StrongPassword1', first)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', first)).resolves.toBe(false);
    await expect(verifyPassword('StrongPassword1', 'malformed')).resolves.toBe(false);
  });
});

