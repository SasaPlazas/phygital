import { io } from "socket.io-client";

// Hardcoded Production URL to ensure connection works
const RENDER_URL = "https://phygital-server.onrender.com";

// If in Production (Vercel), use Render URL.
// If in Development (Local), use local network IP.
const URL = import.meta.env.PROD
  ? RENDER_URL
  : `${window.location.protocol}//${window.location.hostname}:3001`;

// Log to help debug connection issues in production
console.log("Socket initializing...");
console.log("Environment mode:", import.meta.env.MODE);
console.log("Target URL:", URL);

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
