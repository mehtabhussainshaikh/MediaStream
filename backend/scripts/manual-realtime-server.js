import { createServer } from 'node:http';
import { Server } from 'socket.io';

const server = createServer();
const io = new Server(server, { cors: { origin: 'http://127.0.0.1:5173', credentials: true } });
io.use((socket, next) => socket.handshake.auth?.token ? next() : next(new Error('Authentication required')));
io.on('connection', (socket) => {
  setTimeout(() => socket.emit('media:uploaded', {
    id: '64b7f0f2c8d8a33e62f89999', ownerId: '64b7f0f2c8d8a33e62f81234',
    title: 'Classical Study', mediaType: 'image', createdAt: new Date().toISOString(),
  }), 300);
});
server.listen(3002, '127.0.0.1', () => console.log('Manual realtime server listening on http://127.0.0.1:3002'));
