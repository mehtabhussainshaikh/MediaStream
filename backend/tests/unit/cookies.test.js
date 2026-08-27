import { parseCookies, refreshCookieOptions } from '../../src/features/auth/cookies.js';

describe('refresh cookies', () => {
  test('parses encoded cookie values', () => {
    expect(parseCookies('first=one; mediastream_refresh=a%20b')).toEqual({
      first: 'one', mediastream_refresh: 'a b',
    });
  });

  test('uses HttpOnly secure production options and the auth-only path', () => {
    expect(refreshCookieOptions({
      isProduction: true, cookieSameSite: 'none', refreshSessionTtlDays: 7,
    })).toEqual({
      httpOnly: true, secure: true, sameSite: 'none', path: '/api/v1/auth', maxAge: 604_800_000,
    });
  });
});
