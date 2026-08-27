import { jest } from '@jest/globals';
import { createCloudinaryAdapter } from '../../src/infrastructure/cloudinary/cloudinary.adapter.js';

function clientWithUpload(result, error) {
  const end = jest.fn();
  const client = {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((_options, callback) => {
        queueMicrotask(() => callback(error, result));
        return { end };
      }),
      destroy: jest.fn(async () => ({ result: 'ok' })),
    },
  };
  return { client, end };
}

describe('Cloudinary adapter', () => {
  const config = { cloudName: 'cloud', apiKey: 'key', apiSecret: 'secret' };

  test('streams a memory buffer with owner-scoped options', async () => {
    const provider = {
      public_id: 'id', resource_type: 'image',
      secure_url: 'https://res.cloudinary.com/test/image/upload/id.jpg', format: 'jpg',
    };
    const { client, end } = clientWithUpload(provider);
    const adapter = createCloudinaryAdapter(config, client);
    await expect(adapter.upload({ buffer: Buffer.from('file'), resourceType: 'image', ownerId: 'user-id' }))
      .resolves.toBe(provider);
    expect(client.uploader.upload_stream.mock.calls[0][0]).toMatchObject({
      resource_type: 'image', folder: 'mediastream/user-id', overwrite: false,
    });
    expect(end).toHaveBeenCalledWith(expect.any(Buffer));
  });

  test('maps upload and unexpected deletion failures to STORAGE_ERROR', async () => {
    const { client } = clientWithUpload(undefined, new Error('provider failed'));
    const adapter = createCloudinaryAdapter(config, client);
    await expect(adapter.upload({ buffer: Buffer.from('x'), resourceType: 'image', ownerId: 'user' }))
      .rejects.toMatchObject({ status: 502, code: 'STORAGE_ERROR' });
    client.uploader.destroy.mockResolvedValue({ result: 'failed' });
    await expect(adapter.destroy({ publicId: 'id', resourceType: 'image' }))
      .rejects.toMatchObject({ status: 502, code: 'STORAGE_ERROR' });
  });

  test('rejects incomplete provider metadata before persistence', async () => {
    const { client } = clientWithUpload({ public_id: 'id' });
    const adapter = createCloudinaryAdapter(config, client);
    await expect(adapter.upload({ buffer: Buffer.from('x'), resourceType: 'image', ownerId: 'user' }))
      .rejects.toMatchObject({ status: 502, code: 'STORAGE_ERROR' });
  });

  test('deletes by publicId and resource type and accepts already-missing assets', async () => {
    const { client } = clientWithUpload({});
    client.uploader.destroy.mockResolvedValue({ result: 'not found' });
    const adapter = createCloudinaryAdapter(config, client);
    await adapter.destroy({ publicId: 'id', resourceType: 'video' });
    expect(client.uploader.destroy).toHaveBeenCalledWith('id', { resource_type: 'video', invalidate: true });
  });
});
