import { AppError } from '../../shared/app-error.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationError(details) {
  return new AppError({
    status: 400,
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details,
  });
}

export function validateRegistration(body) {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const details = [];
  if (name.length < 2 || name.length > 80) details.push({ field: 'name', message: 'Must contain 2-80 characters' });
  if (!EMAIL_PATTERN.test(email) || email.length > 254) details.push({ field: 'email', message: 'Must be a valid email address' });
  if (password.length < 8 || password.length > 128) details.push({ field: 'password', message: 'Must contain 8-128 characters' });
  if (details.length) throw validationError(details);
  return { name, email, password };
}

export function validateLogin(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const details = [];
  if (!EMAIL_PATTERN.test(email)) details.push({ field: 'email', message: 'Must be a valid email address' });
  if (!password) details.push({ field: 'password', message: 'Is required' });
  if (details.length) throw validationError(details);
  return { email, password };
}

