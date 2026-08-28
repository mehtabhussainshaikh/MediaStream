import { jest } from '@jest/globals';
import { createMediaSearchService } from '../../src/features/media/media-search.service.js';

describe('media search service', () => {
  test('returns pagination metadata around repository results', async () => {
    const media = { search: jest.fn(async () => ({ items: [{ _id: 'id' }], total: 41 })) };
    const service = createMediaSearchService({ media });
    const criteria = {
      q: undefined, type: undefined, tags: [], from: undefined, to: undefined,
      sort: 'newest', page: 2, limit: 20, skip: 20,
    };
    await expect(service.search(criteria, { id: 'owner-id', role: 'user' })).resolves.toEqual({
      items: [{ _id: 'id' }],
      meta: { page: 2, limit: 20, total: 41, totalPages: 3, hasNextPage: true, hasPreviousPage: true },
    });
    expect(media.search).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, limit: 20, filter: { status: 'ready', ownerId: 'owner-id' } }));
  });

  test('returns atomically incremented media and maps missing records', async () => {
    const media = { findById: jest.fn(async () => ({ _id: 'id', ownerId: 'owner-id' })), incrementView: jest.fn(async () => ({ _id: 'id', viewCount: 2 })) };
    const service = createMediaSearchService({ media });
    await expect(service.incrementView('id', { id: 'owner-id', role: 'user' })).resolves.toMatchObject({ viewCount: 2 });
    media.incrementView.mockResolvedValueOnce(null);
    await expect(service.incrementView('missing', { id: 'owner-id', role: 'user' })).rejects.toMatchObject({
      status: 404, code: 'MEDIA_NOT_FOUND',
    });
  });

  test('rejects view increments from a different owner', async () => {
    const media = { findById: jest.fn(async () => ({ _id: 'id', ownerId: 'owner-id' })), incrementView: jest.fn() };
    const service = createMediaSearchService({ media });
    await expect(service.incrementView('id', { id: 'different-user', role: 'user' }))
      .rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
    expect(media.incrementView).not.toHaveBeenCalled();
  });
});
