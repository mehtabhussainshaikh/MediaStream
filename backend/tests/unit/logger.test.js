import { jest } from '@jest/globals';
import { logger } from '../../src/shared/logger.js';

describe('logger', () => {
  test('redacts nested secrets', () => {
    const output = jest.spyOn(console, 'log').mockImplementation(() => {});
    logger.info('redaction_test', {
      password: 'unsafe',
      nested: { tokenHash: 'unsafe', safe: 'visible' },
    });
    const entry = JSON.parse(output.mock.calls[0][0]);
    expect(entry.password).toBe('[REDACTED]');
    expect(entry.nested.tokenHash).toBe('[REDACTED]');
    expect(entry.nested.safe).toBe('visible');
    output.mockRestore();
  });
});
