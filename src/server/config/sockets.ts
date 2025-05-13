// src/server/config/sockets.ts
import { Server } from 'socket.io';
import { setupSockets } from '../socket';

// Export the setupSocketHandlers function that just calls setupSockets
export const setupSocketHandlers = (io: Server) => {
  console.log("Using setupSocketHandlers from config/sockets.ts");
  return setupSockets(io);
};

// Provide a default export for backward compatibility
const configureSockets = (io: Server) => {
  console.log("Using configureSockets from config/sockets.ts");
  return setupSockets(io);
};

export default configureSockets;