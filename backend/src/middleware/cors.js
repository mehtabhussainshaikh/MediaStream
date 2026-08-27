import { AppError } from '../shared/app-error.js';

export function corsForOrigin(allowedOrigin) {
  return function corsMiddleware(request, response, next) {
    const origin = request.get('origin');
    if (origin && origin !== allowedOrigin) {
      next(new AppError({
        status: 403,
        code: 'FORBIDDEN',
        message: 'Origin is not allowed',
      }));
      return;
    }

    if (origin === allowedOrigin) {
      response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
      response.setHeader('Access-Control-Allow-Credentials', 'true');
      response.setHeader('Vary', 'Origin');
    }

    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      response.status(204).end();
      return;
    }

    next();
  };
}

