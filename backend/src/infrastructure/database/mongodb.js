import mongoose from 'mongoose';

export function createMongoConnection(uri, mongooseInstance = mongoose) {
  const readyState = () => mongooseInstance.connection.readyState;

  return Object.freeze({
    async connect() {
      await mongooseInstance.connect(uri);
      await mongooseInstance.connection.db.admin().ping();
    },
    async close() {
      await mongooseInstance.disconnect();
    },
    isReady() {
      return readyState() === 1;
    },
    database() {
      if (readyState() !== 1) {
        throw new Error('MongoDB connection is not ready');
      }
      return mongooseInstance.connection;
    },
  });
}
