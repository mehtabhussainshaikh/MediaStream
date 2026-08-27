import { readFile } from 'node:fs/promises';

const collectionPath = new URL('../../postman/MediaStream.postman_collection.json', import.meta.url);

describe('Postman collection', () => {
  test('is valid JSON and covers every mandatory endpoint', async () => {
    const collection = JSON.parse(await readFile(collectionPath, 'utf8'));
    const requests = [];
    const visit = (items) => items.forEach((item) => {
      if (item.request) requests.push(`${item.request.method} ${typeof item.request.url === 'string' ? item.request.url : item.request.url.raw}`);
      if (item.item) visit(item.item);
    });
    visit(collection.item);
    expect(requests).toEqual(expect.arrayContaining([
      'GET {{baseUrl}}/health',
      'POST {{baseUrl}}/api/v1/auth/register',
      'POST {{baseUrl}}/api/v1/auth/login',
      'POST {{baseUrl}}/api/v1/auth/refresh',
      'POST {{baseUrl}}/api/v1/auth/logout',
      'GET {{baseUrl}}/api/v1/auth/me',
      'POST {{baseUrl}}/api/v1/media',
      'GET {{baseUrl}}/api/v1/media?q=demo&sort=relevance&page=1&limit=20',
      'GET {{baseUrl}}/api/v1/media/mine?page=1&limit=20',
      'GET {{baseUrl}}/api/v1/media/{{mediaId}}',
      'PATCH {{baseUrl}}/api/v1/media/{{mediaId}}',
      'DELETE {{baseUrl}}/api/v1/media/{{mediaId}}',
      'POST {{baseUrl}}/api/v1/media/{{mediaId}}/view',
    ]));
  });
});
