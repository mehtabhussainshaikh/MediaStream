import { AppError } from '../../shared/app-error.js';

export function createRateLimit({ limit = 5, windowMs = 15 * 60 * 1000, clock = Date.now } = {}) {
  const attempts = new Map();
  return function rateLimit(request, _response, next) {
    const key = request.ip;
    const now = clock();
    const existing = attempts.get(key);
    const entry = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + windowMs }
      : existing;
    entry.count += 1;
    attempts.set(key, entry);
    if (entry.count > limit) {
      next(new AppError({ status: 429, code: 'RATE_LIMITED', message: 'Too many authentication attempts' }));
      return;
    }
    next();
  };
}

