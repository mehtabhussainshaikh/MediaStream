import { Router } from 'express';
import multer from 'multer';
import { AppError } from '../../shared/app-error.js';
import { createCloudinaryAdapter } from '../../infrastructure/cloudinary/cloudinary.adapter.js';
import { fileTypeFor } from './media-types.js';
import { createMediaRepository } from './media.repository.js';
import { createMediaUploadController } from './media-upload.controller.js';
import { createMediaUploadService } from './media-upload.service.js';

export function buildMediaUploadModule({ config, logger }) {
  return {
    service: createMediaUploadService({
      media: createMediaRepository(),
      storage: createCloudinaryAdapter(config.cloudinary),
      logger,
    }),
  };
}

export function createMediaUploadRouter({ service, authenticate, config }) {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { files: 1, fileSize: Math.max(...Object.values(config.uploadLimitsBytes)) },
    fileFilter(_request, file, callback) {
      if (!fileTypeFor(file.mimetype)) {
        callback(new AppError({ status: 415, code: 'UNSUPPORTED_MEDIA', message: 'File type is not supported' }));
        return;
      }
      callback(null, true);
    },
  });
  router.post('/', authenticate, upload.single('file'), createMediaUploadController({
    service,
    uploadLimitsBytes: config.uploadLimitsBytes,
  }));
  return router;
}
