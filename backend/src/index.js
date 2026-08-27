import { createApp } from './app/create-app.js';
import { loadConfig } from './config/env.js';
import { createMongoConnection } from './infrastructure/database/mongodb.js';
import { logger } from './shared/logger.js';
import { startServer } from './server/start-server.js';
import { createTokenService } from './features/auth/token.service.js';
import { createNotificationHub } from './infrastructure/realtime/notification-hub.js';

async function main() {
  const config = loadConfig();
  const database = createMongoConnection(config.mongodbUri);
  const tokens = createTokenService({ accessSecret: config.jwtAccessSecret, accessTtl: config.accessTokenTtl });
  const realtime = createNotificationHub({ frontendOrigin: config.frontendOrigin, verifyAccessToken: tokens.verifyAccessToken, logger });
  const app = createApp({ config, database, logger, notifications: realtime });
  await startServer({ app, database, config, logger, realtime });
}

main().catch((error) => {
  logger.error('startup_failed', {
    error: { name: error.name, message: error.message },
  });
  process.exitCode = 1;
});
