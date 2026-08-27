import { randomUUID } from 'node:crypto';

export function requestContext(request, response, next) {
  const startedAt = process.hrtime.bigint();
  request.requestId = randomUUID();
  response.setHeader('X-Request-Id', request.requestId);

  response.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    request.app.locals.logger.info('http_request', {
      requestId: request.requestId,
      method: request.method,
      route: request.originalUrl,
      status: response.statusCode,
      durationMs: Number(duration.toFixed(2)),
      userId: request.user?.id,
    });
  });

  next();
}

