import { jest } from '@jest/globals';
import { createMediaCrudService } from '../../src/features/media/media-crud.service.js';

const ownerId = '507f1f77bcf86cd799439011';
const id = '507f191e810c19729de860ea';
const record = {
  _id: id, ownerId, title: 'Media', publicId: 'provider-id', resourceType: 'video',
};

function setup() {
  const media = {
    findById: jest.fn(async () => record),
    search: jest.fn(async () => ({ items: [record], total: 21 })),
    updateMetadata: jest.fn(async (_id, metadata) => ({ ...record, ...metadata })),
    deleteById: jest.fn(async () => record),
  };
  const storage = { destroy: jest.fn(async () => {}) };
  return { service: createMediaCrudService({ media, storage }), media, storage };
}

describe('media CRUD service', () => {
  test('lists only the current owner with pagination metadata', async () => {
    const { service, media } = setup();
    const criteria = { q: undefined, type: 'video', tags: ['demo'], from: undefined, to: undefined, sort: 'newest', page: 2, limit: 20, skip: 20 };
    await expect(service.mine(ownerId, criteria)).resolves.toEqual({
      items: [record],
      meta: { page: 2, limit: 20, total: 21, totalPages: 2, hasNextPage: false, hasPreviousPage: true },
    });
    expect(media.search).toHaveBeenCalledWith(expect.objectContaining({
      filter: expect.objectContaining({ ownerId, mediaType: 'video', tags: { $all: ['demo'] } }),
    }));
  });

  test('returns details and maps missing records to MEDIA_NOT_FOUND', async () => {
    const { service, media } = setup();
    await expect(service.details(id, { id: ownerId, role: 'user' })).resolves.toBe(record);
    media.findById.mockResolvedValueOnce(null);
    await expect(service.details(id, { id: ownerId, role: 'user' })).rejects.toMatchObject({ status: 404, code: 'MEDIA_NOT_FOUND' });
  });

  test('rejects detail access from a different owner', async () => {
    const { service } = setup();
    await expect(service.details(id, { id: 'different-user', role: 'user' }))
      .rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });

  test('allows owner/admin updates and rejects forged ownership', async () => {
    const { service, media } = setup();
    await expect(service.update(id, { id: ownerId, role: 'user' }, { title: 'Updated' }))
      .resolves.toMatchObject({ title: 'Updated' });
    await expect(service.update(id, { id: 'other', role: 'admin' }, { title: 'Admin update' }))
      .resolves.toMatchObject({ title: 'Admin update' });
    await expect(service.update(id, { id: 'other', role: 'user' }, { title: 'Forged' }))
      .rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(media.updateMetadata).toHaveBeenCalledTimes(2);
  });

  test('deletes Cloudinary first and then MongoDB', async () => {
    const { service, media, storage } = setup();
    const order = [];
    storage.destroy.mockImplementation(async () => order.push('cloudinary'));
    media.deleteById.mockImplementation(async () => { order.push('mongodb'); return record; });
    await expect(service.delete(id, { id: ownerId, role: 'user' })).resolves.toEqual({ id, deleted: true });
    expect(storage.destroy).toHaveBeenCalledWith({ publicId: 'provider-id', resourceType: 'video' });
    expect(order).toEqual(['cloudinary', 'mongodb']);
  });

  test('preserves MongoDB metadata when Cloudinary deletion fails', async () => {
    const { service, media, storage } = setup();
    storage.destroy.mockRejectedValue(new Error('provider failed'));
    await expect(service.delete(id, { id: ownerId, role: 'user' })).rejects.toThrow('provider failed');
    expect(media.deleteById).not.toHaveBeenCalled();
  });
});
