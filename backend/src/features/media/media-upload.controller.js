import { validateUploadFile, validateUploadMetadata } from './media.validator.js';

export function createMediaUploadController({ service, uploadLimitsBytes }) {
  return async function uploadMedia(request, response) {
    const metadata = validateUploadMetadata(request.body);
    metadata.fileType = validateUploadFile(request.file, uploadLimitsBytes);
    const result = await service.upload({
      ownerId: request.user.id,
      file: request.file,
      metadata,
    });
    response.status(201).json({ success: true, data: { media: result } });
  };
}

