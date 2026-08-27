import { Router } from 'express';
import { createCloudinaryAdapter } from '../../infrastructure/cloudinary/cloudinary.adapter.js';
import { createMediaCrudController } from './media-crud.controller.js';
import { createMediaCrudService } from './media-crud.service.js';
import { createMediaRepository } from './media.repository.js';

export function buildMediaCrudModule({ config }) {
  return {
    service: createMediaCrudService({
      media: createMediaRepository(),
      storage: createCloudinaryAdapter(config.cloudinary),
    }),
  };
}

export function createMediaCrudRouter({ service, authenticate }) {
  const router = Router();
  const controller = createMediaCrudController({ service });
  router.use(authenticate);
  router.get('/mine', controller.mine);
  router.get('/:id', controller.details);
  router.patch('/:id', controller.update);
  router.delete('/:id', controller.delete);
  return router;
}
