export const MIME_TYPES = Object.freeze({
  'image/jpeg': { mediaType: 'image', extension: 'jpg', resourceType: 'image' },
  'image/png': { mediaType: 'image', extension: 'png', resourceType: 'image' },
  'image/webp': { mediaType: 'image', extension: 'webp', resourceType: 'image' },
  'image/gif': { mediaType: 'image', extension: 'gif', resourceType: 'image' },
  'video/mp4': { mediaType: 'video', extension: 'mp4', resourceType: 'video' },
  'video/webm': { mediaType: 'video', extension: 'webm', resourceType: 'video' },
  'video/quicktime': { mediaType: 'video', extension: 'mov', resourceType: 'video' },
  'audio/mpeg': { mediaType: 'audio', extension: 'mp3', resourceType: 'video' },
  'audio/wav': { mediaType: 'audio', extension: 'wav', resourceType: 'video' },
  'audio/ogg': { mediaType: 'audio', extension: 'ogg', resourceType: 'video' },
  'audio/mp4': { mediaType: 'audio', extension: 'm4a', resourceType: 'video' },
  'application/pdf': { mediaType: 'pdf', extension: 'pdf', resourceType: 'image' },
});

export function fileTypeFor(mimeType) {
  return MIME_TYPES[mimeType];
}

