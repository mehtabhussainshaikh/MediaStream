import { buildMediaSearchQuery } from '../../src/features/media/media-search.query.js';

describe('media search query builder', () => {
  test('builds weighted relevance with deterministic tie-breakers and filters', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T23:59:59.999Z');
    expect(buildMediaSearchQuery({
      q: 'launch', type: 'video', tags: ['demo', 'featured'], from, to,
      sort: 'relevance', skip: 20, limit: 10,
    })).toEqual({
      filter: {
        status: 'ready', $text: { $search: 'launch' }, mediaType: 'video',
        tags: { $all: ['demo', 'featured'] }, createdAt: { $gte: from, $lte: to },
      },
      projection: { score: { $meta: 'textScore' } },
      sort: { score: { $meta: 'textScore' }, viewCount: -1, createdAt: -1, _id: 1 },
      skip: 20, limit: 10,
    });
  });

  test.each([
    ['newest', { createdAt: -1, _id: 1 }],
    ['oldest', { createdAt: 1, _id: 1 }],
    ['mostViewed', { viewCount: -1, createdAt: -1, _id: 1 }],
  ])('builds deterministic %s order', (sort, expected) => {
    expect(buildMediaSearchQuery({
      q: undefined, type: undefined, tags: [], from: undefined, to: undefined,
      sort, skip: 0, limit: 20,
    })).toMatchObject({ filter: { status: 'ready' }, projection: {}, sort: expected });
  });
});
