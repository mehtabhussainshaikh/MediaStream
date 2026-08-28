import { validateMediaId } from './media-crud.validator.js';
import { validateMediaSearch } from './media-search.validator.js';

export function createMediaSearchController({ service }) {
  return Object.freeze({
    async search(request, response) {
      const result = await service.search(validateMediaSearch(request.query), request.user);
      response.json({ success: true, data: { media: result.items }, meta: result.meta });
    },
    async incrementView(request, response) {
      const media = await service.incrementView(validateMediaId(request.params.id), request.user);
      response.json({ success: true, data: { media } });
    },
  });
}
