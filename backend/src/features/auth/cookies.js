export function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [part.trim(), ''];
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    return [key, decodeURIComponent(value)];
  }).filter(([key]) => key));
}

export function refreshCookieOptions(config) {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.cookieSameSite,
    path: '/api/v1/auth',
    maxAge: config.refreshSessionTtlDays * 24 * 60 * 60 * 1000,
  };
}

