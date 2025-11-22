// src/services/socket.js
import { io } from 'socket.io-client';

// Use a relative path for socket in dev; Vite will proxy /socket.io to the backend.
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || '/socket.io';

export const socket = io({
  // connect to same origin and use the configured path
  path: SOCKET_PATH,
  autoConnect: false,
  transports: ['websocket'],
});

socket.on('connect', () => {
  // socket connected
});
socket.on('connect_error', (err) => {
  console.error('[socket] connect_error', err && err.message ? err.message : err);
});
socket.on('disconnect', () => {
  // socket disconnected
});
