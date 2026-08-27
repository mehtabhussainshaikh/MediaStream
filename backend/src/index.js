import { createApp } from './app/create-app.js';
import { loadConfig } from './config/env.js';
import { createMongoConnection } from './infrastructure/database/mongodb.js';
import { logger } from './shared/logger.js';
import { startServer } from './server/start-server.js';

async function main() {
  const config = loadConfig();
  const database = createMongoConnection(config.mongodbUri);
  const app = createApp({ config, database, logger });
  await startServer({ app, database, config, logger });
}

main().catch((error) => {
  logger.error('startup_failed', {
    error: { name: error.name, message: error.message },
  });
  process.exitCode = 1;
});

