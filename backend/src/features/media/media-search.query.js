export function buildMediaSearchQuery(criteria) {
  const filter = { status: 'ready' };
  if (criteria.q) filter.$text = { $search: criteria.q };
  if (criteria.type) filter.mediaType = criteria.type;
  if (criteria.tags.length) filter.tags = { $all: criteria.tags };
  if (criteria.from || criteria.to) {
    filter.createdAt = {};
    if (criteria.from) filter.createdAt.$gte = criteria.from;
    if (criteria.to) filter.createdAt.$lte = criteria.to;
  }

  let projection = {};
  let sort;
  if (criteria.sort === 'relevance') {
    projection = { score: { $meta: 'textScore' } };
    sort = { score: { $meta: 'textScore' }, viewCount: -1, createdAt: -1, _id: 1 };
  } else if (criteria.sort === 'mostViewed') {
    sort = { viewCount: -1, createdAt: -1, _id: 1 };
  } else if (criteria.sort === 'oldest') {
    sort = { createdAt: 1, _id: 1 };
  } else {
    sort = { createdAt: -1, _id: 1 };
  }
  return { filter, projection, sort, skip: criteria.skip, limit: criteria.limit };
}
