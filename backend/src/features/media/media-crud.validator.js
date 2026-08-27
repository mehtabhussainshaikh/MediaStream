import mongoose from 'mongoose';
import { AppError } from '../../shared/app-error.js';

function validationError(details) {
  return new AppError({ status: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed', details });
}
export function validateMediaId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw validationError([{ field: 'id', message: 'Must be a valid media identifier' }]);
  }
  return id;
}

export function validateOwnerPagination(query = {}) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  const details = [];
  if (!Number.isSafeInteger(page) || page < 1) details.push({ field: 'page', message: 'Must be a positive integer' });
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) details.push({ field: 'limit', message: 'Must be an integer from 1 to 50' });
  const unexpected = Object.keys(query).filter((key) => !['page', 'limit'].includes(key));
  if (unexpected.length) details.push({ field: 'query', message: `Unexpected parameters: ${unexpected.join(', ')}` });
  if (details.length) throw validationError(details);
  return { page, limit, skip: (page - 1) * limit };
}

export function validateMetadataPatch(body = {}) {
  const allowed = ['title', 'description', 'tags'];
  const unexpected = Object.keys(body).filter((key) => !allowed.includes(key));
  const details = [];
  if (unexpected.length) details.push({ field: 'body', message: `Unexpected fields: ${unexpected.join(', ')}` });

  const metadata = {};
  if (Object.hasOwn(body, 'title')) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length < 2 || title.length > 120) details.push({ field: 'title', message: 'Must contain 2-120 characters' });
    else metadata.title = title;
  }
  if (Object.hasOwn(body, 'description')) {
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (description.length > 2000) details.push({ field: 'description', message: 'Must contain at most 2000 characters' });
    else metadata.description = description;
  }
  if (Object.hasOwn(body, 'tags')) {
    if (!Array.isArray(body.tags)) {
      details.push({ field: 'tags', message: 'Must be an array of strings' });
    } else {
      const tags = [...new Set(body.tags.map((tag) => typeof tag === 'string' ? tag.trim().toLowerCase() : '').filter(Boolean))];
      if (tags.length > 10) details.push({ field: 'tags', message: 'Must contain at most 10 unique tags' });
      if (tags.some((tag) => tag.length > 30)) details.push({ field: 'tags', message: 'Each tag must contain at most 30 characters' });
      if (!details.some((detail) => detail.field === 'tags')) metadata.tags = tags;
    }
  }
  if (!Object.keys(metadata).length && !details.length) {
    details.push({ field: 'body', message: 'At least one of title, description, or tags is required' });
  }
  if (details.length) throw validationError(details);
  return metadata;
}
