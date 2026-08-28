import { AppError } from '../../shared/app-error.js';
import { fileTypeFor } from './media-types.js';

function validationError(details) {
  return new AppError({ status: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed', details });
}

export function validateUploadMetadata(body = {}) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const rawTags = (Array.isArray(body.tags) ? body.tags : [body.tags])
    .flatMap((value) => String(value || '').split(','));
  const tags = [...new Set(rawTags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
  const details = [];
  const unexpectedFields = Object.keys(body).filter((field) => !['title', 'description', 'tags'].includes(field));
  if (unexpectedFields.length) details.push({ field: 'body', message: `Unexpected fields: ${unexpectedFields.join(', ')}` });
  if (title.length < 2 || title.length > 120) details.push({ field: 'title', message: 'Must contain 2-120 characters' });
  if (description.length > 2000) details.push({ field: 'description', message: 'Must contain at most 2000 characters' });
  if (tags.length > 10) details.push({ field: 'tags', message: 'Must contain at most 10 unique tags' });
  if (tags.some((tag) => tag.length > 30)) details.push({ field: 'tags', message: 'Each tag must contain at most 30 characters' });
  if (details.length) throw validationError(details);
  return { title, description, tags };
}

export function validateUploadFile(file, uploadLimitsBytes) {
  if (!file) {
    throw validationError([{ field: 'file', message: 'Exactly one file is required' }]);
  }
  if (!file.originalname || file.originalname.length > 255) {
    throw validationError([{ field: 'file', message: 'Original filename must contain 1-255 characters' }]);
  }
  const type = fileTypeFor(file.mimetype);
  if (!type) {
    throw new AppError({ status: 415, code: 'UNSUPPORTED_MEDIA', message: 'File type is not supported' });
  }
  if (file.size > uploadLimitsBytes[type.mediaType]) {
    throw new AppError({
      status: 413,
      code: 'FILE_TOO_LARGE',
      message: `File exceeds the ${type.mediaType} upload limit`,
    });
  }
  return type;
}
