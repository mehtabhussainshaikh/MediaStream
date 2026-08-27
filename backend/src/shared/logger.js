const REDACTED_KEYS = /password|token|authorization|cookie|secret|mongodb|connection/i;

function sanitize(value) {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        REDACTED_KEYS.test(key) ? '[REDACTED]' : sanitize(nestedValue),
      ]),
    );
  }
  return value;
}

function write(level, event, context = {}) {
  const entry = sanitize({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  });
  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}

export const logger = Object.freeze({
  info(event, context) {
    write('info', event, context);
  },
  error(event, context) {
    write('error', event, context);
  },
});

