import http from 'node:http';

const user = { _id: '64b7f0f2c8d8a33e62f81234', name: 'Manual Tester', email: 'tester@example.com', role: 'user', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
let authenticated = false;
let media = [{ _id: '64b7f0f2c8d8a33e62f89999', ownerId: user._id, title: 'Classical Study', description: 'A sample piece for browser verification.', tags: ['classical', 'sample'], originalName: 'study.svg', mimeType: 'image/svg+xml', extension: 'svg', sizeBytes: 2048, mediaType: 'image', publicId: 'sample', resourceType: 'image', secureUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22800%22 height=%22600%22%3E%3Crect width=%22800%22 height=%22600%22 fill=%22%2317243a%22/%3E%3Ccircle cx=%22400%22 cy=%22300%22 r=%22140%22 fill=%22%23b18843%22/%3E%3C/svg%3E', format: 'svg', status: 'ready', viewCount: 4, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];

const response = (res, status, payload, origin = 'http://127.0.0.1:5173') => { res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': origin, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'content-type, authorization', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE,OPTIONS' }); res.end(JSON.stringify(payload)); };
const read = (req) => new Promise((resolve) => { let body = ''; req.on('data', (chunk) => { body += chunk; }); req.on('end', () => resolve(body)); });
const success = (data, meta) => ({ success: true, data, ...(meta ? { meta } : {}) });
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return response(res, 204, {});
  const url = new URL(req.url, 'http://localhost:3000'); const path = url.pathname;
  if (path === '/api/v1/auth/login' && req.method === 'POST') { authenticated = true; return response(res, 200, success({ user, accessToken: 'manual-token', expiresInSeconds: 900 })); }
  if (path === '/api/v1/auth/register' && req.method === 'POST') return response(res, 201, success({ user }));
  if (path === '/api/v1/auth/refresh' && req.method === 'POST') return response(res, authenticated ? 200 : 401, authenticated ? success({ user, accessToken: 'manual-token', expiresInSeconds: 900 }) : { success: false, error: { message: 'Authentication required' } });
  if (path === '/api/v1/auth/logout' && req.method === 'POST') { authenticated = false; return response(res, 200, success({ loggedOut: true })); }
  if (!authenticated) return response(res, 401, { success: false, error: { message: 'Authentication required' } });
  if (path === '/api/v1/auth/me') return response(res, 200, success({ user }));
  if (path === '/api/v1/media' && req.method === 'GET') { const query = url.searchParams.get('q')?.toLowerCase(); const items = query ? media.filter((item) => item.title.toLowerCase().includes(query) || item.tags.some((tag) => tag.includes(query))) : media; return response(res, 200, success({ items }, { page: 1, limit: 20, total: items.length, totalPages: items.length ? 1 : 0, hasNextPage: false, hasPreviousPage: false })); }
  if (path === '/api/v1/media/mine' && req.method === 'GET') return response(res, 200, success({ items: media }, { page: 1, limit: 20, total: media.length, totalPages: media.length ? 1 : 0, hasNextPage: false, hasPreviousPage: false }));
  if (path === '/api/v1/media' && req.method === 'POST') { await read(req); const created = { ...media[0], _id: '64b7f0f2c8d8a33e62f80001', title: 'Browser Upload', originalName: 'browser.png', viewCount: 0, createdAt: new Date().toISOString() }; media = [created, ...media]; return response(res, 201, success({ media: created })); }
  const match = path.match(/^\/api\/v1\/media\/([a-f0-9]{24})(?:\/(view))?$/);
  if (match) { const item = media.find((entry) => entry._id === match[1]); if (!item) return response(res, 404, { success: false, error: { message: 'Media not found' } }); if (match[2] && req.method === 'POST') { item.viewCount += 1; return response(res, 200, success({ media: item })); } if (req.method === 'GET') return response(res, 200, success({ media: item })); if (req.method === 'PATCH') { const body = JSON.parse(await read(req)); Object.assign(item, body); return response(res, 200, success({ media: item })); } if (req.method === 'DELETE') { media = media.filter((entry) => entry._id !== item._id); return response(res, 200, success({ deleted: true })); } }
  return response(res, 404, { success: false, error: { message: 'Not found' } });
});
server.listen(3001, '127.0.0.1', () => console.log('Manual API listening on http://127.0.0.1:3001'));
