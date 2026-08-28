import { describe, expect, it } from 'vitest';
import { normalizeTags, validateFile, validateUpload } from './validation';

describe('upload validation', () => {
  it('normalizes duplicate tags', () => expect(normalizeTags(' Film, travel,film ')).toEqual(['film', 'travel']));
  it('normalizes multiple tag values', () => expect(normalizeTags([' Film, travel ', 'featured', 'film'])).toEqual(['film', 'travel', 'featured']));
  it('accepts a valid image', () => expect(validateUpload({ file: new File(['data'], 'photo.jpg', { type: 'image/jpeg' }), title: 'Holiday', description: '', tags: 'travel' })).toEqual({}));
  it('rejects unsupported files and short titles', () => expect(validateUpload({ file: new File(['x'], 'file.exe', { type: 'application/octet-stream' }), title: 'x', description: '', tags: '' })).toMatchObject({ file: expect.any(String), title: expect.any(String) }));
  it('explains the configured video limit immediately', () => { const file = new File(['x'], 'large.webm', { type: 'video/webm' }); Object.defineProperty(file, 'size', { value: 260.91 * 1024 * 1024 }); expect(validateFile(file)).toMatch(/100 MB or smaller.*260\.91 MB/); });
});
