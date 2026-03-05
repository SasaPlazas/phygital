import { io } from 'socket.io-client';

// Use environment variable if available, otherwise default to localhost
const URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

let socket;

// Singleton pattern for development to prevent multiple connections during HMR
if (import.meta.env.DEV) {
  if (!window.globalSocket) {
    window.globalSocket = io(URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  socket = window.globalSocket;
} else {
  socket = io(URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
}

export { socket };
