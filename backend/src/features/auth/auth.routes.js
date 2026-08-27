import { Router } from 'express';
import { createAuthController } from './auth.controller.js';
import { createAuthenticate } from './auth.middleware.js';
import { createRateLimit } from './rate-limit.js';
import { createAuthService } from './auth.service.js';
import { createRefreshSessionRepository } from './refresh-session.repository.js';
import { createTokenService } from './token.service.js';
import { createUserRepository } from '../users/user.repository.js';

export function buildAuthModule({ config }) {
  const users = createUserRepository();
  const sessions = createRefreshSessionRepository();
  const tokens = createTokenService({
    accessSecret: config.jwtAccessSecret,
    accessTtl: config.accessTokenTtl,
  });
  const service = createAuthService({
    users,
    sessions,
    tokens,
    refreshSessionTtlDays: config.refreshSessionTtlDays,
  });
  return { service, tokens, authenticate: createAuthenticate({ tokens, users }) };
}

export function createAuthRouter({ service, authenticate, config }) {
  const router = Router();
  const controller = createAuthController({ service, config });
  const loginRateLimit = createRateLimit();
  router.post('/register', controller.register);
  router.post('/login', loginRateLimit, controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.get('/me', authenticate, controller.me);
  return router;
}
