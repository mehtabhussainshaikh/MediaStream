import { AppError } from '../../shared/app-error.js';

export function createAuthenticate({ tokens, users }) {
  return async function authenticate(request, _response, next) {
    const authorization = request.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new AppError({ status: 401, code: 'UNAUTHENTICATED', message: 'Access token is required' });
    }
    try {
      const payload = tokens.verifyAccessToken(token);
      const user = await users.findPublicById(payload.sub);
      if (!user) throw new Error('User missing');
      request.user = { id: String(user._id), role: user.role };
      next();
    } catch (error) {
      throw new AppError({
        status: 401,
        code: 'UNAUTHENTICATED',
        message: 'Access token is invalid or expired',
        cause: error,
      });
    }
  };
}

