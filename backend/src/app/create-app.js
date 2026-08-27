import express from 'express';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { corsForOrigin } from '../middleware/cors.js';
import { errorHandler, notFound } from '../middleware/error-handler.js';
import { requestContext } from '../middleware/request-context.js';
import { openApiDocument } from '../infrastructure/swagger/openapi.js';
import { buildAuthModule, createAuthRouter } from '../features/auth/auth.routes.js';
import { buildMediaUploadModule, createMediaUploadRouter } from '../features/media/media-upload.routes.js';
import { buildMediaCrudModule, createMediaCrudRouter } from '../features/media/media-crud.routes.js';

export function createApp({ config, database, logger, authModule, mediaUploadModule, mediaCrudModule }) {
  const app = express();
  app.disable('x-powered-by');
  if (config.isProduction) {
    app.set('trust proxy', 1);
  }

  app.locals.config = config;
  app.locals.database = database;
  app.locals.logger = logger;

  app.use(requestContext);
  app.use(helmet());
  app.use(corsForOrigin(config.frontendOrigin));
  app.use(express.json({ limit: config.jsonBodyLimit }));

  const resolvedAuthModule = authModule || buildAuthModule({ config });
  app.use('/api/v1/auth', createAuthRouter({ ...resolvedAuthModule, config }));
  const resolvedMediaUploadModule = mediaUploadModule || buildMediaUploadModule({ config, logger });
  app.use('/api/v1/media', createMediaUploadRouter({
    ...resolvedMediaUploadModule,
    authenticate: resolvedAuthModule.authenticate,
    config,
  }));
  const resolvedMediaCrudModule = mediaCrudModule || buildMediaCrudModule({ config });
  app.use('/api/v1/media', createMediaCrudRouter({
    ...resolvedMediaCrudModule,
    authenticate: resolvedAuthModule.authenticate,
  }));

  app.get('/health', (request, response) => {
    const ready = request.app.locals.database.isReady();
    response.status(ready ? 200 : 503).json({
      success: true,
      data: {
        status: ready ? 'ready' : 'not_ready',
        database: ready ? 'connected' : 'disconnected',
        uptimeSeconds: Number(process.uptime().toFixed(3)),
      },
    });
  });

  app.get('/api-docs.json', (_request, response) => response.json(openApiDocument));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
