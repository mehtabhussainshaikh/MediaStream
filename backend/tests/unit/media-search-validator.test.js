import { validateMediaSearch } from '../../src/features/media/media-search.validator.js';

describe('media search validation', () => {
  test('normalizes a complete relevance query', () => {
    expect(validateMediaSearch({
      q: ' launch video ', type: 'video', tags: ' Demo,featured,demo ',
      from: '2026-01-01', to: '2026-01-31', page: '2', limit: '10',
    })).toEqual({
      q: 'launch video', type: 'video', tags: ['demo', 'featured'],
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T23:59:59.999Z'),
      sort: 'relevance', page: 2, limit: 10, skip: 10,
    });
  });

  test('defaults non-text listing to newest with bounded pagination', () => {
    expect(validateMediaSearch({})).toEqual({
      q: undefined, type: undefined, tags: [], from: undefined, to: undefined,
      sort: 'newest', page: 1, limit: 20, skip: 0,
    });
  });

  test.each([
    [{ q: 'text', sort: 'mostViewed' }, 'non-relevance text sort'],
    [{ sort: 'relevance' }, 'relevance without text'],
    [{ type: 'document' }, 'invalid media type'],
    [{ from: '2026-02-30' }, 'invalid calendar date'],
    [{ from: '2026-02-02', to: '2026-02-01' }, 'reversed date range'],
    [{ page: '0', limit: '51' }, 'invalid pagination'],
    [{ unknown: 'value' }, 'unexpected parameter'],
  ])('rejects %s (%s)', (query) => {
    expect(() => validateMediaSearch(query)).toThrow(expect.objectContaining({
      status: 400, code: 'VALIDATION_ERROR',
    }));
  });
});
