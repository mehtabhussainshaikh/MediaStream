import { Router } from 'express';
import { createMediaRepository } from './media.repository.js';
import { createMediaSearchController } from './media-search.controller.js';
import { createMediaSearchService } from './media-search.service.js';

export function buildMediaSearchModule() {
  return { service: createMediaSearchService({ media: createMediaRepository() }) };
}

export function createMediaSearchRouter({ service, authenticate }) {
  const router = Router();
  const controller = createMediaSearchController({ service });
  router.use(authenticate);
  router.get('/', controller.search);
  router.post('/:id/view', controller.incrementView);
  return router;
}
