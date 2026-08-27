export const SUPPORTED_TYPES = { 'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image', 'video/mp4': 'video', 'video/webm': 'video', 'video/quicktime': 'video', 'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/ogg': 'audio', 'audio/mp4': 'audio', 'application/pdf': 'pdf' };
const env = import.meta.env;
export const LIMITS_MB = { image: Number(env.VITE_MAX_IMAGE_SIZE_MB || 10), video: Number(env.VITE_MAX_VIDEO_SIZE_MB || 100), audio: Number(env.VITE_MAX_AUDIO_SIZE_MB || 25), pdf: Number(env.VITE_MAX_PDF_SIZE_MB || 20) };

export function normalizeTags(value) { return [...new Set(value.split(',').map((tag) => tag.trim().toLowerCase()).filter(Boolean))]; }
export function validateUpload({ file, title, description, tags }) {
  const errors = {}; const mediaType = file && SUPPORTED_TYPES[file.type]; const normalizedTags = normalizeTags(tags);
  if (!file) errors.file = 'Choose a file to upload.';
  else if (!mediaType) errors.file = 'Choose a JPEG, PNG, WebP, GIF, MP4, WebM, MOV, MP3, WAV, OGG, M4A, or PDF file.';
  else if (file.size > LIMITS_MB[mediaType] * 1024 * 1024) errors.file = `${mediaType[0].toUpperCase() + mediaType.slice(1)} files must be ${LIMITS_MB[mediaType]} MB or smaller.`;
  if (title.trim().length < 2 || title.trim().length > 120) errors.title = 'Title must be between 2 and 120 characters.';
  if (description.length > 2000) errors.description = 'Description cannot exceed 2,000 characters.';
  if (normalizedTags.length > 10) errors.tags = 'Use no more than 10 unique tags.';
  else if (normalizedTags.some((tag) => tag.length > 30)) errors.tags = 'Each tag must be 30 characters or fewer.';
  return errors;
}
