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

// Helpful client-side logs to debug connection issues during demo
try {
  console.log('[socket] configured path:', SOCKET_PATH);
} catch (e) {
  /* ignore */
}

socket.on('connect', () => {
  console.log('[socket] connected, id=', socket.id);
});
socket.on('connect_error', (err) => {
  console.error('[socket] connect_error', err && err.message ? err.message : err);
});
socket.on('disconnect', (reason) => {
  console.log('[socket] disconnected, reason=', reason);
});
