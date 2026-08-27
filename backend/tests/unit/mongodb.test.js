import { jest } from '@jest/globals';
import { createMongoConnection } from '../../src/infrastructure/database/mongodb.js';

describe('MongoDB connection', () => {
  test('connects, pings, exposes the database, and closes cleanly', async () => {
    const connection = {
      readyState: 0,
      db: { admin: () => ({ ping: jest.fn().mockResolvedValue({ ok: 1 }) }) },
    };
    const mongooseInstance = {
      connection,
      connect: jest.fn(async () => {
        connection.readyState = 1;
      }),
      disconnect: jest.fn(async () => {
        connection.readyState = 0;
      }),
    };
    const database = createMongoConnection(
      'mongodb://localhost:27017/mediastream-test',
      mongooseInstance,
    );

    expect(database.isReady()).toBe(false);
    expect(() => database.database()).toThrow('MongoDB connection is not ready');

    await database.connect();
    expect(mongooseInstance.connect).toHaveBeenCalledWith(
      'mongodb://localhost:27017/mediastream-test',
    );
    expect(database.isReady()).toBe(true);
    expect(database.database()).toBe(connection);

    await database.close();
    expect(mongooseInstance.disconnect).toHaveBeenCalledTimes(1);
    expect(database.isReady()).toBe(false);
  });
});
