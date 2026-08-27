const ALLOWED_ENVIRONMENTS = new Set(['development', 'test', 'production']);

function requiredString(source, key) {
  const value = source[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function positiveInteger(source, key, fallback) {
  const rawValue = source[key] ?? String(fallback);
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${key} must be a positive integer`);
  }
  return value;
}

function validOrigin(source) {
  const value = requiredString(source, 'FRONTEND_ORIGIN');
  let origin;
  try {
    origin = new URL(value);
  } catch {
    throw new Error('FRONTEND_ORIGIN must be a valid absolute URL');
  }
  if (!['http:', 'https:'].includes(origin.protocol) || origin.origin !== value) {
    throw new Error('FRONTEND_ORIGIN must contain only an HTTP(S) origin');
  }
  return origin.origin;
}

function secret(source, key) {
  const value = requiredString(source, key);
  if (value.length < 32) {
    throw new Error(`${key} must contain at least 32 characters`);
  }
  return value;
}

function sameSitePolicy(source, isProduction) {
  const value = source.COOKIE_SAME_SITE?.trim().toLowerCase() || (isProduction ? 'none' : 'lax');
  if (!['strict', 'lax', 'none'].includes(value)) {
    throw new Error('COOKIE_SAME_SITE must be strict, lax, or none');
  }
  if (value === 'none' && !isProduction) {
    throw new Error('COOKIE_SAME_SITE=none requires production secure cookies');
  }
  return value;
}

export function loadConfig(source = process.env) {
  const nodeEnv = source.NODE_ENV?.trim() || 'development';
  if (!ALLOWED_ENVIRONMENTS.has(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }

  const isProduction = nodeEnv === 'production';
  return Object.freeze({
    nodeEnv,
    isProduction,
    port: positiveInteger(source, 'PORT', 3000),
    mongodbUri: requiredString(source, 'MONGODB_URI'),
    frontendOrigin: validOrigin(source),
    jsonBodyLimit: source.JSON_BODY_LIMIT?.trim() || '100kb',
    shutdownTimeoutMs: positiveInteger(source, 'SHUTDOWN_TIMEOUT_MS', 10_000),
    jwtAccessSecret: secret(source, 'JWT_ACCESS_SECRET'),
    accessTokenTtl: '15m',
    refreshSessionTtlDays: 7,
    refreshCookieName: 'mediastream_refresh',
    cookieSameSite: sameSitePolicy(source, isProduction),
  });
}
