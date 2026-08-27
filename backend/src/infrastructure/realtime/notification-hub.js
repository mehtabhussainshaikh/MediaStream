import { Server } from 'socket.io';

export function createNotificationHub({ frontendOrigin, verifyAccessToken, logger }) {
  let io;

  return Object.freeze({
    attach(server) {
      io = new Server(server, {
        cors: { origin: frontendOrigin, credentials: true },
        transports: ['websocket', 'polling'],
      });
      io.use((socket, next) => {
        try {
          const token = socket.handshake.auth?.token;
          if (!token || typeof token !== 'string') throw new Error('Missing access token');
          const payload = verifyAccessToken(token);
          socket.data.user = { id: payload.sub, role: payload.role };
          next();
        } catch {
          const error = new Error('Authentication required');
          error.data = { code: 'UNAUTHENTICATED' };
          next(error);
        }
      });
      io.on('connection', (socket) => {
        logger.info('realtime_connected', { userId: socket.data.user.id, socketId: socket.id });
        socket.on('disconnect', (reason) => logger.info('realtime_disconnected', { userId: socket.data.user.id, socketId: socket.id, reason }));
      });
    },
    mediaUploaded(media) {
      if (!io) return;
      io.emit('media:uploaded', {
        id: String(media._id),
        ownerId: String(media.ownerId),
        title: media.title,
        mediaType: media.mediaType,
        createdAt: media.createdAt,
      });
    },
    async close() {
      if (!io) return;
      await new Promise((resolve) => io.close(resolve));
      io = undefined;
    },
  });
}
