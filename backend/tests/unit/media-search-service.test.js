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
    await expect(service.search(criteria)).resolves.toEqual({
      items: [{ _id: 'id' }],
      meta: { page: 2, limit: 20, total: 41, totalPages: 3, hasNextPage: true, hasPreviousPage: true },
    });
    expect(media.search).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, limit: 20 }));
  });

  test('returns atomically incremented media and maps missing records', async () => {
    const media = { incrementView: jest.fn(async () => ({ _id: 'id', viewCount: 2 })) };
    const service = createMediaSearchService({ media });
    await expect(service.incrementView('id')).resolves.toMatchObject({ viewCount: 2 });
    media.incrementView.mockResolvedValueOnce(null);
    await expect(service.incrementView('missing')).rejects.toMatchObject({
      status: 404, code: 'MEDIA_NOT_FOUND',
    });
  });
});
