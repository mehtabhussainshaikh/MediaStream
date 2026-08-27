import mongoose from 'mongoose';

const refreshSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true, ref: 'User' },
  tokenHash: { type: String, required: true, unique: true, select: false },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
  revokedAt: { type: Date, default: null },
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
}, {
  timestamps: true,
  versionKey: false,
});

export const RefreshSession = mongoose.models.RefreshSession
  || mongoose.model('RefreshSession', refreshSessionSchema);

