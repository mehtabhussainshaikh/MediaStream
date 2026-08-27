import { Media } from './media.model.js';

export function createMediaRepository(model = Media) {
  return Object.freeze({
    async create(input) {
      const document = await model.create(input);
      return document.toObject ? document.toObject() : document;
    },
    async findById(id) {
      return model.findById(id).lean();
    },
    async listByOwner(ownerId, { skip, limit }) {
      const filter = { ownerId };
      const [items, total] = await Promise.all([
        model.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit).lean(),
        model.countDocuments(filter),
      ]);
      return { items, total };
    },
    async updateMetadata(id, metadata) {
      return model.findByIdAndUpdate(
        id,
        { $set: metadata },
        { new: true, runValidators: true },
      ).lean();
    },
    async deleteById(id) {
      return model.findByIdAndDelete(id).lean();
    },
    async search({ filter, projection, sort, skip, limit }) {
      const [items, total] = await Promise.all([
        model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean(),
        model.countDocuments(filter),
      ]);
      return { items, total };
    },
    async incrementView(id) {
      return model.findOneAndUpdate(
        { _id: id, status: 'ready' },
        { $inc: { viewCount: 1 } },
        { new: true },
      ).lean();
    },
  });
}
