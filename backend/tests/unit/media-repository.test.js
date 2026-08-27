import { jest } from '@jest/globals';
import { createMediaRepository } from '../../src/features/media/media.repository.js';

function leanQuery(result) {
  return { lean: jest.fn(async () => result) };
}

describe('media repository', () => {
  test('creates and reads media records', async () => {
    const created = { _id: 'media-id', title: 'Media' };
    const findQuery = leanQuery(created);
    const model = {
      create: jest.fn(async () => ({ toObject: () => created })),
      findById: jest.fn(() => findQuery),
    };
    const repository = createMediaRepository(model);
    await expect(repository.create({ title: 'Media' })).resolves.toBe(created);
    await expect(repository.findById('media-id')).resolves.toBe(created);
  });

  test('lists an owner in deterministic newest-first order', async () => {
    const items = [{ _id: 'media-id' }];
    const query = {
      sort: jest.fn(() => query), skip: jest.fn(() => query),
      limit: jest.fn(() => query), lean: jest.fn(async () => items),
    };
    const model = {
      find: jest.fn(() => query),
      countDocuments: jest.fn(async () => 1),
    };
    const repository = createMediaRepository(model);
    await expect(repository.listByOwner('owner-id', { skip: 20, limit: 10 }))
      .resolves.toEqual({ items, total: 1 });
    expect(model.find).toHaveBeenCalledWith({ ownerId: 'owner-id' });
    expect(query.sort).toHaveBeenCalledWith({ createdAt: -1, _id: -1 });
    expect(query.skip).toHaveBeenCalledWith(20);
    expect(query.limit).toHaveBeenCalledWith(10);
  });

  test('updates only supplied metadata with validators and deletes by ID', async () => {
    const updated = { _id: 'media-id', title: 'Updated' };
    const updateQuery = leanQuery(updated);
    const deleteQuery = leanQuery(updated);
    const model = {
      findByIdAndUpdate: jest.fn(() => updateQuery),
      findByIdAndDelete: jest.fn(() => deleteQuery),
    };
    const repository = createMediaRepository(model);
    await expect(repository.updateMetadata('media-id', { title: 'Updated' })).resolves.toBe(updated);
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      'media-id', { $set: { title: 'Updated' } }, { new: true, runValidators: true },
    );
    await expect(repository.deleteById('media-id')).resolves.toBe(updated);
  });
});
