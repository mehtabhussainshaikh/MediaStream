import { jest } from '@jest/globals';
import express from 'express';
import { startServer } from '../../src/server/start-server.js';

describe('server lifecycle', () => {
  test('connects before listening and closes HTTP and MongoDB on shutdown', async () => {
    const events = [];
    const database = {
      connect: jest.fn(async () => events.push('database_connected')),
      close: jest.fn(async () => events.push('database_closed')),
    };
    const logger = { info: jest.fn(), error: jest.fn() };
    const app = express();
    app.get('/health', (_request, response) => response.sendStatus(200));

    const { server, shutdown } = await startServer({
      app,
      database,
      config: {
        port: 0,
        nodeEnv: 'test',
        shutdownTimeoutMs: 1_000,
      },
      logger,
      installSignalHandlers: false,
    });

    expect(server.listening).toBe(true);
    expect(events).toEqual(['database_connected']);

    await shutdown('TEST');
    expect(server.listening).toBe(false);
    expect(events).toEqual(['database_connected', 'database_closed']);
    expect(logger.info).toHaveBeenCalledWith('shutdown_complete', { signal: 'TEST' });
  });
});

