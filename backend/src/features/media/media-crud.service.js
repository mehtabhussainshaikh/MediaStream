import { AppError } from '../../shared/app-error.js';
import { assertCanManageMedia } from './media.policy.js';
import { buildMediaSearchQuery } from './media-search.query.js';

function notFound() {
  return new AppError({ status: 404, code: 'MEDIA_NOT_FOUND', message: 'Media was not found' });
}
export function createMediaCrudService({ media, storage }) {
  async function requireMedia(id) {
    const record = await media.findById(id);
    if (!record) throw notFound();
    return record;
  }

  return Object.freeze({
    async mine(ownerId, criteria) {
      const query = buildMediaSearchQuery(criteria);
      query.filter.ownerId = ownerId;
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
    async details(id, user) {
      const current = await requireMedia(id);
      assertCanManageMedia(user, current);
      return current;
    },
    async update(id, user, metadata) {
      const current = await requireMedia(id);
      assertCanManageMedia(user, current);
      const updated = await media.updateMetadata(id, metadata);
      if (!updated) throw notFound();
      return updated;
    },
    async delete(id, user) {
      const current = await requireMedia(id);
      assertCanManageMedia(user, current);
      await storage.destroy({ publicId: current.publicId, resourceType: current.resourceType });
      const deleted = await media.deleteById(id);
      if (!deleted) throw notFound();
      return { id: String(deleted._id), deleted: true };
    },
  });
}
