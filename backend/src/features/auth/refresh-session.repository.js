import { RefreshSession } from './refresh-session.model.js';

export function createRefreshSessionRepository(model = RefreshSession) {
  return Object.freeze({
    async create(input) {
      return model.create(input);
    },
    async consumeActive(tokenHash, now) {
      return model.findOneAndUpdate(
        { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
        { $set: { revokedAt: now } },
        { new: false },
      ).select('+tokenHash').lean();
    },
    async revoke(tokenHash, now) {
      await model.updateOne(
        { tokenHash, revokedAt: null },
        { $set: { revokedAt: now } },
      );
    },
  });
}

