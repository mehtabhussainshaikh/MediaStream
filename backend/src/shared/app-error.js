export class AppError extends Error {
  constructor({ status, code, message, details, cause }) {
    super(message, { cause });
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

