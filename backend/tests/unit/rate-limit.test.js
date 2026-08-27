import { jest } from '@jest/globals';
import { createRateLimit } from '../../src/features/auth/rate-limit.js';

describe('authentication rate limit', () => {
  test('rejects requests above the limit and resets after the window', () => {
    let now = 1_000;
    const middleware = createRateLimit({ limit: 2, windowMs: 100, clock: () => now });
    const request = { ip: '127.0.0.1' };
    const first = jest.fn();
    const second = jest.fn();
    const blocked = jest.fn();
    middleware(request, {}, first);
    middleware(request, {}, second);
    middleware(request, {}, blocked);
    expect(first).toHaveBeenCalledWith();
    expect(second).toHaveBeenCalledWith();
    expect(blocked.mock.calls[0][0]).toMatchObject({ status: 429, code: 'RATE_LIMITED' });

    now = 1_101;
    const reset = jest.fn();
    middleware(request, {}, reset);
    expect(reset).toHaveBeenCalledWith();
  });
});

