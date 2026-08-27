import { parseCookies, refreshCookieOptions } from './cookies.js';
import { validateLogin, validateRegistration } from './auth.validator.js';

function requestContext(request) {
  return { userAgent: request.get('user-agent'), ipAddress: request.ip };
}

export function createAuthController({ service, config }) {
  const cookieOptions = refreshCookieOptions(config);
  const { maxAge: _maxAge, ...clearCookieOptions } = cookieOptions;
  const getRefreshToken = (request) => parseCookies(request.get('cookie'))[config.refreshCookieName];
  const sendSession = (response, result) => {
    response.cookie(config.refreshCookieName, result.refreshToken, cookieOptions);
    response.json({
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        expiresInSeconds: result.expiresInSeconds,
      },
    });
  };

  return Object.freeze({
    async register(request, response) {
      const user = await service.register(validateRegistration(request.body));
      response.status(201).json({ success: true, data: { user } });
    },
    async login(request, response) {
      sendSession(response, await service.login(validateLogin(request.body), requestContext(request)));
    },
    async refresh(request, response) {
      sendSession(response, await service.refresh(getRefreshToken(request), requestContext(request)));
    },
    async logout(request, response) {
      await service.logout(getRefreshToken(request));
      response.clearCookie(config.refreshCookieName, clearCookieOptions);
      response.json({ success: true, data: { loggedOut: true } });
    },
    async me(request, response) {
      const user = await service.currentUser(request.user.id);
      response.json({ success: true, data: { user } });
    },
  });
}
