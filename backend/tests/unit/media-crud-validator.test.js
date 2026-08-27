import { validateMediaId, validateMetadataPatch, validateOwnerPagination } from '../../src/features/media/media-crud.validator.js';

describe('media CRUD validation', () => {
  test('validates media IDs and owner pagination', () => {
    expect(validateMediaId('507f1f77bcf86cd799439011')).toBe('507f1f77bcf86cd799439011');
    expect(() => validateMediaId('mine')).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    expect(validateOwnerPagination({ page: '2', limit: '25' })).toEqual({ page: 2, limit: 25, skip: 25 });
    expect(validateOwnerPagination({})).toEqual({ page: 1, limit: 20, skip: 0 });
    expect(() => validateOwnerPagination({ page: '0', limit: '51' }))
      .toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  test('normalizes partial editable metadata', () => {
    expect(validateMetadataPatch({ title: ' Updated title ', tags: [' Demo ', 'demo', 'MEDIA'] }))
      .toEqual({ title: 'Updated title', tags: ['demo', 'media'] });
    expect(validateMetadataPatch({ description: '' })).toEqual({ description: '' });
  });

  test.each([
    [{}, 'empty body'],
    [{ ownerId: 'forged' }, 'immutable owner'],
    [{ publicId: 'forged' }, 'provider metadata'],
    [{ tags: 'not-an-array' }, 'non-array tags'],
    [{ title: 'x' }, 'invalid title'],
  ])('rejects invalid patch: %s (%s)', (body) => {
    expect(() => validateMetadataPatch(body)).toThrow(expect.objectContaining({
      status: 400, code: 'VALIDATION_ERROR',
    }));
  });
});
