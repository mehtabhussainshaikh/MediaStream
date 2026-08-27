import { createServer } from 'node:http';
import { jest } from '@jest/globals';
import { io as createClient } from 'socket.io-client';
import { createNotificationHub } from '../../src/infrastructure/realtime/notification-hub.js';

const logger = { info: jest.fn() };

describe('notification hub', () => {
  let server;
  let hub;
  afterEach(async () => { await hub?.close(); if (server?.listening) await new Promise((resolve) => server.close(resolve)); });

  test('authenticates a socket and publishes safe upload metadata', async () => {
    server = createServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    hub = createNotificationHub({ frontendOrigin: 'http://localhost:5173', verifyAccessToken: (token) => token === 'valid' ? { sub: 'user-1', role: 'user' } : (() => { throw new Error('bad token'); })(), logger });
    hub.attach(server);
    const client = createClient(`http://127.0.0.1:${server.address().port}`, { auth: { token: 'valid' }, transports: ['websocket'] });
    const event = new Promise((resolve, reject) => { client.once('media:uploaded', resolve); client.once('connect_error', reject); });
    await new Promise((resolve, reject) => { client.once('connect', resolve); client.once('connect_error', reject); });
    hub.mediaUploaded({ _id: 'media-1', ownerId: 'user-1', title: 'New upload', mediaType: 'image', createdAt: '2026-08-27T00:00:00.000Z', secureUrl: 'secret-url' });
    await expect(event).resolves.toEqual({ id: 'media-1', ownerId: 'user-1', title: 'New upload', mediaType: 'image', createdAt: '2026-08-27T00:00:00.000Z' });
    client.close();
  });

  test('rejects unauthenticated sockets', async () => {
    server = createServer();
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    hub = createNotificationHub({ frontendOrigin: 'http://localhost:5173', verifyAccessToken: () => { throw new Error('bad token'); }, logger });
    hub.attach(server);
    const client = createClient(`http://127.0.0.1:${server.address().port}`, { transports: ['websocket'], reconnection: false });
    const error = await new Promise((resolve) => client.once('connect_error', resolve));
    expect(error.message).toBe('Authentication required');
    client.close();
  });
});
