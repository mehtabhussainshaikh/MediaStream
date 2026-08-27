import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, immutable: true, index: true, ref: 'User' },
  title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  extension: { type: String, required: true },
  sizeBytes: { type: Number, required: true, min: 1 },
  mediaType: { type: String, required: true, enum: ['image', 'video', 'audio', 'pdf'] },
  publicId: { type: String, required: true, unique: true },
  resourceType: { type: String, required: true, enum: ['image', 'video', 'raw'] },
  secureUrl: { type: String, required: true },
  format: { type: String, required: true },
  dimensions: {
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 },
  },
  duration: { type: Number, min: 0 },
  status: { type: String, enum: ['uploading', 'ready', 'failed'], default: 'ready' },
  viewCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true, versionKey: false });

mediaSchema.index({ ownerId: 1, createdAt: -1 });
mediaSchema.index({ mediaType: 1, createdAt: -1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index(
  { title: 'text', originalName: 'text', tags: 'text', description: 'text' },
  { weights: { title: 10, originalName: 8, tags: 6, description: 2 }, name: 'media_weighted_text' },
);

export const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);

