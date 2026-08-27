import { AppError } from '../../shared/app-error.js';

export function assertCanManageMedia(user, media) {
  if (user.role === 'admin' || String(media.ownerId) === String(user.id)) return;
  throw new AppError({
    status: 403,
    code: 'FORBIDDEN',
    message: 'You are not allowed to modify this media',
  });
}
