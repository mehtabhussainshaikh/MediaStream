import { validateMediaId, validateMetadataPatch, validateOwnerPagination } from './media-crud.validator.js';

export function createMediaCrudController({ service }) {
  return Object.freeze({
    async mine(request, response) {
      const result = await service.mine(request.user.id, validateOwnerPagination(request.query));
      response.json({ success: true, data: { media: result.items }, meta: result.meta });
    },
    async details(request, response) {
      const media = await service.details(validateMediaId(request.params.id));
      response.json({ success: true, data: { media } });
    },
    async update(request, response) {
      const media = await service.update(
        validateMediaId(request.params.id),
        request.user,
        validateMetadataPatch(request.body),
      );
      response.json({ success: true, data: { media } });
    },
    async delete(request, response) {
      const result = await service.delete(validateMediaId(request.params.id), request.user);
      response.json({ success: true, data: result });
    },
  });
}
