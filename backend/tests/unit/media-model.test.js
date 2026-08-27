import { Media } from '../../src/features/media/media.model.js';

function indexFor(indexes, expectedKeys) {
  return indexes.find(([keys]) => JSON.stringify(keys) === JSON.stringify(expectedKeys));
}

describe('Media model', () => {
  test('defines lifecycle, ownership, and ranking defaults', () => {
    expect(Media.schema.path('ownerId').options).toMatchObject({ required: true, immutable: true });
    expect(Media.schema.path('status').options).toMatchObject({
      enum: ['uploading', 'ready', 'failed'], default: 'ready',
    });
    expect(Media.schema.path('viewCount').options.default).toBe(0);
  });

  test('defines required compound, tag, and weighted text indexes', () => {
    const indexes = Media.schema.indexes();
    expect(indexFor(indexes, { ownerId: 1, createdAt: -1 })).toBeDefined();
    expect(indexFor(indexes, { mediaType: 1, createdAt: -1 })).toBeDefined();
    expect(indexFor(indexes, { tags: 1 })).toBeDefined();
    const textIndex = indexFor(indexes, { title: 'text', originalName: 'text', tags: 'text', description: 'text' });
    expect(textIndex[1]).toMatchObject({
      weights: { title: 10, originalName: 8, tags: 6, description: 2 }, name: 'media_weighted_text',
    });
  });
});

