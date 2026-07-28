// socket.js — Client Socket.IO Singleton Helper
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';
// Strip /api suffix for base websocket server connection URL
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '');

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected to CBT Server:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected from CBT Server');
    });
  }

  return socket;
};
