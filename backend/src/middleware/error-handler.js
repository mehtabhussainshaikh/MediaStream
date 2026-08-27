import { AppError } from '../shared/app-error.js';
import multer from 'multer';

export function notFound(request, response, next) {
  next(new AppError({
    status: 404,
    code: 'RESOURCE_NOT_FOUND',
    message: 'Requested resource was not found',
  }));
}

export function errorHandler(error, request, response, _next) {
  let normalizedError = error;
  if (error.type === 'entity.parse.failed') {
    normalizedError = new AppError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request body contains invalid JSON',
      cause: error,
    });
  } else if (error.type === 'entity.too.large') {
    normalizedError = new AppError({
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Request body exceeds the allowed size',
      cause: error,
    });
  } else if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    normalizedError = new AppError({
      status: 413, code: 'FILE_TOO_LARGE', message: 'File exceeds the maximum upload size', cause: error,
    });
  } else if (error instanceof multer.MulterError) {
    normalizedError = new AppError({
      status: 400, code: 'VALIDATION_ERROR', message: 'Multipart upload is invalid', cause: error,
    });
  }

  const isKnown = normalizedError instanceof AppError;
  const status = isKnown ? normalizedError.status : 500;
  const code = isKnown ? normalizedError.code : 'INTERNAL_ERROR';
  const message = isKnown ? normalizedError.message : 'An unexpected error occurred';

  request.app.locals.logger.error('request_error', {
    requestId: request.requestId,
    route: request.originalUrl,
    status,
    error: {
      name: normalizedError.name,
      code,
      message,
      ...(normalizedError.cause && {
        cause: {
          name: normalizedError.cause.name,
          message: normalizedError.cause.message,
          httpCode: normalizedError.cause.http_code,
        },
      }),
    },
  });

  const body = {
    success: false,
    error: { code, message },
    requestId: request.requestId,
  };
  if (isKnown && normalizedError.details !== undefined) {
    body.error.details = normalizedError.details;
  }

  response.status(status).json(body);
}
