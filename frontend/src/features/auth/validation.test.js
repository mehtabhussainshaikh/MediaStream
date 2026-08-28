import { describe, expect, it } from 'vitest';
import { validateLogin, validateRegistration } from './validation';

describe('authentication validation', () => {
  it('rejects malformed login values', () => expect(validateLogin({ email: 'wrong', password: '' })).toEqual({ email: 'Enter a valid email address.', password: 'Enter your password.' }));
  it('accepts a complete registration', () => expect(validateRegistration({ name: 'Ada Lovelace', email: 'ada@example.com', password: 'very-secret' })).toEqual({}));
});
