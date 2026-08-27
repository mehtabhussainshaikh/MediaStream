import { describe, expect, it } from 'vitest';
import { getApiError } from './api';

describe('API error mapping', () => {
  it('uses sanitized backend messages', () => expect(getApiError({ status: 400, data: { error: { message: 'Title is required' } } })).toBe('Title is required'));
  it('gives specific upload and network guidance', () => { expect(getApiError({ status: 413 })).toMatch(/larger/); expect(getApiError({ status: 'FETCH_ERROR' })).toMatch(/reach the server/); });
});
