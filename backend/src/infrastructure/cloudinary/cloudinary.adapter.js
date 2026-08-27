import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../../shared/app-error.js';

function storageError(error) {
  return new AppError({
    status: 502,
    code: 'STORAGE_ERROR',
    message: 'Media storage operation failed',
    cause: error,
  });
}

export function createCloudinaryAdapter(config, client = cloudinary) {
  client.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });

  return Object.freeze({
    async upload({ buffer, resourceType, ownerId }) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = client.uploader.upload_stream({
            resource_type: resourceType,
            folder: `mediastream/${ownerId}`,
            use_filename: false,
            unique_filename: true,
            overwrite: false,
          }, (error, result) => (error ? reject(error) : resolve(result)));
          stream.end(buffer);
        });
        if (!result?.public_id || !result.resource_type || !result.secure_url || !result.format) {
          throw new Error('Cloudinary returned incomplete upload metadata');
        }
        return result;
      } catch (error) {
        throw storageError(error);
      }
    },
    async destroy({ publicId, resourceType }) {
      try {
        const result = await client.uploader.destroy(publicId, {
          resource_type: resourceType,
          invalidate: true,
        });
        if (!['ok', 'not found'].includes(result.result)) {
          throw new Error(`Unexpected Cloudinary deletion result: ${result.result}`);
        }
      } catch (error) {
        throw storageError(error);
      }
    },
  });
}
