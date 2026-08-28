import { validateUploadFile, validateUploadMetadata } from '../../src/features/media/media.validator.js';

const limits = { image: 10, video: 100, audio: 25, pdf: 20 };

describe('media upload validation', () => {
  test('normalizes and deduplicates multipart metadata', () => {
    expect(validateUploadMetadata({
      title: '  Launch Image ', description: ' Preview ', tags: ' Demo,MEDIA,demo ',
    })).toEqual({ title: 'Launch Image', description: 'Preview', tags: ['demo', 'media'] });
  });

  test('normalizes repeated and comma-separated tag fields together', () => {
    expect(validateUploadMetadata({ title: 'Launch Image', tags: [' Demo,MEDIA ', 'featured', 'demo'] }))
      .toEqual({ title: 'Launch Image', description: '', tags: ['demo', 'media', 'featured'] });
  });

  test('rejects invalid metadata and missing files', () => {
    expect(() => validateUploadMetadata({ title: 'x', tags: Array.from({ length: 11 }, (_, i) => `tag${i}`) }))
      .toThrow(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }));
    expect(() => validateUploadFile(undefined, limits))
      .toThrow(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }));
    expect(() => validateUploadMetadata({ title: 'Valid title', ownerId: 'forged-owner' }))
      .toThrow(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }));
  });

  test.each([
    ['image/jpeg', 'image', 'image'], ['video/mp4', 'video', 'video'],
    ['audio/mpeg', 'audio', 'video'], ['application/pdf', 'pdf', 'image'],
  ])('accepts %s as %s with Cloudinary resource type %s', (mimetype, mediaType, resourceType) => {
    expect(validateUploadFile({ mimetype, size: 5, originalname: 'file.bin' }, limits))
      .toMatchObject({ mediaType, resourceType });
  });

  test('rejects unsupported and per-type oversized files before storage', () => {
    expect(() => validateUploadFile({ mimetype: 'text/plain', size: 1, originalname: 'file.txt' }, limits))
      .toThrow(expect.objectContaining({ status: 415, code: 'UNSUPPORTED_MEDIA' }));
    expect(() => validateUploadFile({ mimetype: 'image/png', size: 11, originalname: 'file.png' }, limits))
      .toThrow(expect.objectContaining({ status: 413, code: 'FILE_TOO_LARGE' }));
  });
});
