import { validateLogin, validateRegistration } from '../../src/features/auth/auth.validator.js';

describe('auth validators', () => {
  test('normalizes registration input', () => {
    expect(validateRegistration({
      name: '  Media User  ', email: ' USER@Example.COM ', password: 'password123',
    })).toEqual({ name: 'Media User', email: 'user@example.com', password: 'password123' });
  });

  test('returns field details for invalid registration', () => {
    expect(() => validateRegistration({ name: 'x', email: 'bad', password: 'short' })).toThrow(
      expect.objectContaining({ code: 'VALIDATION_ERROR', status: 400 }),
    );
  });

  test('normalizes valid login and rejects missing credentials', () => {
    expect(validateLogin({ email: ' A@B.COM ', password: 'secret' })).toEqual({
      email: 'a@b.com', password: 'secret',
    });
    expect(() => validateLogin({})).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });
});

