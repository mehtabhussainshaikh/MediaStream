import { jest } from '@jest/globals';
import { createMediaUploadService } from '../../src/features/media/media-upload.service.js';

const provider = {
  public_id: 'mediastream/user/provider-id', resource_type: 'image',
  secure_url: 'https://res.cloudinary.com/demo/image/upload/provider-id.jpg',
  format: 'jpg', width: 1200, height: 800,
};
const input = {
  ownerId: '507f1f77bcf86cd799439011',
  file: { buffer: Buffer.from('image'), originalname: 'photo.jpg', mimetype: 'image/jpeg', size: 5 },
  metadata: { title: 'Photo', description: '', tags: ['demo'], fileType: { mediaType: 'image', extension: 'jpg', resourceType: 'image' } },
};

function setup() {
  const media = { create: jest.fn(async (record) => ({ _id: 'media-id', ...record })) };
  const storage = { upload: jest.fn(async () => provider), destroy: jest.fn(async () => {}) };
  const logger = { error: jest.fn() };
  return { service: createMediaUploadService({ media, storage, logger }), media, storage, logger };
}

describe('media upload service', () => {
  test('persists only validated file and provider metadata after upload succeeds', async () => {
    const { service, media, storage } = setup();
    await expect(service.upload(input)).resolves.toMatchObject({ _id: 'media-id', status: 'ready', viewCount: 0 });
    expect(storage.upload).toHaveBeenCalledWith({ buffer: input.file.buffer, resourceType: 'image', ownerId: input.ownerId });
    expect(media.create).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: input.ownerId, originalName: 'photo.jpg', publicId: provider.public_id,
      secureUrl: provider.secure_url, dimensions: { width: 1200, height: 800 },
    }));
  });

  test('does not persist when Cloudinary upload fails', async () => {
    const { service, media, storage } = setup();
    storage.upload.mockRejectedValue(new Error('provider failed'));
    await expect(service.upload(input)).rejects.toThrow('provider failed');
    expect(media.create).not.toHaveBeenCalled();
  });

  test('deletes the provider asset when MongoDB persistence fails', async () => {
    const { service, media, storage } = setup();
    media.create.mockRejectedValue(new Error('database failed'));
    await expect(service.upload(input)).rejects.toThrow('database failed');
    expect(storage.destroy).toHaveBeenCalledWith({ publicId: provider.public_id, resourceType: provider.resource_type });
  });

  test('logs a sanitized compensation failure and preserves the database error', async () => {
    const { service, media, storage, logger } = setup();
    const databaseError = new Error('database failed');
    media.create.mockRejectedValue(databaseError);
    storage.destroy.mockRejectedValue(new Error('cleanup failed'));
    await expect(service.upload(input)).rejects.toBe(databaseError);
    expect(logger.error).toHaveBeenCalledWith('cloudinary_compensation_failed', expect.objectContaining({
      publicId: provider.public_id, resourceType: 'image',
    }));
  });
});

