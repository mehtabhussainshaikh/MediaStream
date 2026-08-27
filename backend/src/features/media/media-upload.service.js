export function createMediaUploadService({ media, storage, logger }) {
  return Object.freeze({
    async upload({ ownerId, file, metadata }) {
      const type = metadata.fileType;
      const provider = await storage.upload({
        buffer: file.buffer,
        resourceType: type.resourceType,
        ownerId,
      });

      const record = {
        ownerId,
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        originalName: file.originalname,
        mimeType: file.mimetype,
        extension: type.extension,
        sizeBytes: file.size,
        mediaType: type.mediaType,
        publicId: provider.public_id,
        resourceType: provider.resource_type,
        secureUrl: provider.secure_url,
        format: provider.format,
        dimensions: provider.width && provider.height
          ? { width: provider.width, height: provider.height }
          : undefined,
        duration: provider.duration,
        status: 'ready',
        viewCount: 0,
      };

      try {
        return await media.create(record);
      } catch (error) {
        try {
          await storage.destroy({ publicId: provider.public_id, resourceType: provider.resource_type });
        } catch (cleanupError) {
          logger.error('cloudinary_compensation_failed', {
            ownerId,
            publicId: provider.public_id,
            resourceType: provider.resource_type,
            error: { name: cleanupError.name, message: cleanupError.message },
          });
        }
        throw error;
      }
    },
  });
}
