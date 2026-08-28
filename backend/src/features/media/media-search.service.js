import { AppError } from '../../shared/app-error.js';
import { buildMediaSearchQuery } from './media-search.query.js';
import { assertCanManageMedia } from './media.policy.js';

export function createMediaSearchService({ media }) {
  return Object.freeze({
    async search(criteria, user) {
      const query = buildMediaSearchQuery(criteria);
      if (user.role !== 'admin') query.filter.ownerId = user.id;
      const { items, total } = await media.search(query);
      const totalPages = total === 0 ? 0 : Math.ceil(total / criteria.limit);
      return {
        items,
        meta: {
          page: criteria.page,
          limit: criteria.limit,
          total,
          totalPages,
          hasNextPage: criteria.page < totalPages,
          hasPreviousPage: criteria.page > 1,
        },
      };
    },
    async incrementView(id, user) {
      const current = await media.findById(id);
      if (!current) {
        throw new AppError({ status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media was not found' });
      }
      assertCanManageMedia(user, current);
      const result = await media.incrementView(id);
      if (!result) {
        throw new AppError({ status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media was not found' });
      }
      return result;
    },
  });
}
