import { Media } from './media.model.js';

export function createMediaRepository(model = Media) {
  return Object.freeze({
    async create(input) {
      const document = await model.create(input);
      return document.toObject ? document.toObject() : document;
    },
  });
}

