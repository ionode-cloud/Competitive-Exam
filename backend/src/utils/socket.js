// socket.js — Socket.IO Server Singleton Helper
const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    console.warn('⚠️ Socket.io not initialized yet');
  }
  return io;
};

const emitEvent = (event, data = {}) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = { initSocket, getIO, emitEvent };
