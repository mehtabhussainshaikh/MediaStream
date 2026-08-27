import { AppError } from '../../shared/app-error.js';

const MEDIA_TYPES = new Set(['image', 'video', 'audio', 'pdf']);
const SORTS = new Set(['relevance', 'newest', 'oldest', 'mostViewed']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function validationError(details) {
  return new AppError({ status: 400, code: 'VALIDATION_ERROR', message: 'Request validation failed', details });
}
function singleString(value, field, details) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    details.push({ field, message: 'Must be provided once as a string' });
    return undefined;
  }
  return value.trim();
}

function parseDate(value, field, endOfDay, details) {
  if (value === undefined) return undefined;
  if (!DATE_PATTERN.test(value)) {
    details.push({ field, message: 'Must use YYYY-MM-DD format' });
    return undefined;
  }
  const suffix = endOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z';
  const date = new Date(`${value}${suffix}`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    details.push({ field, message: 'Must be a real calendar date' });
    return undefined;
  }
  return date;
}

export function validateMediaSearch(query = {}) {
  const allowed = ['q', 'type', 'tags', 'from', 'to', 'sort', 'page', 'limit'];
  const details = [];
  const unexpected = Object.keys(query).filter((key) => !allowed.includes(key));
  if (unexpected.length) details.push({ field: 'query', message: `Unexpected parameters: ${unexpected.join(', ')}` });

  const q = singleString(query.q, 'q', details);
  if (q !== undefined && (q.length < 1 || q.length > 200)) details.push({ field: 'q', message: 'Must contain 1-200 characters' });
  const type = singleString(query.type, 'type', details);
  if (type !== undefined && !MEDIA_TYPES.has(type)) details.push({ field: 'type', message: 'Must be image, video, audio, or pdf' });

  const tagsValue = singleString(query.tags, 'tags', details);
  const tags = tagsValue === undefined
    ? []
    : [...new Set(tagsValue.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
  if (tags.length > 10) details.push({ field: 'tags', message: 'Must contain at most 10 unique tags' });
  if (tags.some((tag) => tag.length > 30)) details.push({ field: 'tags', message: 'Each tag must contain at most 30 characters' });

  const from = parseDate(singleString(query.from, 'from', details), 'from', false, details);
  const to = parseDate(singleString(query.to, 'to', details), 'to', true, details);
  if (from && to && from > to) details.push({ field: 'from', message: 'Must not be after to' });

  const requestedSort = singleString(query.sort, 'sort', details);
  const sort = requestedSort || (q ? 'relevance' : 'newest');
  if (!SORTS.has(sort)) details.push({ field: 'sort', message: 'Must be relevance, newest, oldest, or mostViewed' });
  if (q && sort !== 'relevance') details.push({ field: 'sort', message: 'Text search must use relevance order' });
  if (!q && sort === 'relevance') details.push({ field: 'sort', message: 'Relevance requires q' });

  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isSafeInteger(page) || page < 1) details.push({ field: 'page', message: 'Must be a positive integer' });
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50) details.push({ field: 'limit', message: 'Must be an integer from 1 to 50' });
  if (details.length) throw validationError(details);

  return { q, type, tags, from, to, sort, page, limit, skip: (page - 1) * limit };
}
