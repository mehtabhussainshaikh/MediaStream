import { assertCanManageMedia } from '../../src/features/media/media.policy.js';

const media = { ownerId: '507f1f77bcf86cd799439011' };

describe('media authorization policy', () => {
  test('allows the owner and an admin', () => {
    expect(() => assertCanManageMedia({ id: String(media.ownerId), role: 'user' }, media)).not.toThrow();
    expect(() => assertCanManageMedia({ id: 'other-user', role: 'admin' }, media)).not.toThrow();
  });

  test('rejects a different non-admin user', () => {
    expect(() => assertCanManageMedia({ id: 'other-user', role: 'user' }, media))
      .toThrow(expect.objectContaining({ status: 403, code: 'FORBIDDEN' }));
  });
});
