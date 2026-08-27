import { AppError } from '../../shared/app-error.js';
import { assertCanManageMedia } from './media.policy.js';

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
    async mine(ownerId, pagination) {
      const { items, total } = await media.listByOwner(ownerId, pagination);
      const totalPages = total === 0 ? 0 : Math.ceil(total / pagination.limit);
      return {
        items,
        meta: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNextPage: pagination.page < totalPages,
          hasPreviousPage: pagination.page > 1,
        },
      };
    },
    async details(id) {
      return requireMedia(id);
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
