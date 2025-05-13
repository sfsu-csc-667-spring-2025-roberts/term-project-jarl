// src/server/socket/index.ts
import { Server, Socket } from 'socket.io';
import { setupChatHandlers } from './chat';
import { setupGamesHandlers } from './games';
import { setupFriendsHandlers } from './friends';

// The main setupSockets function needs to be exported properly
export function setupSockets(io: Server): void {
  console.log('Setting up socket.io handlers');

  // Handle new connections
  io.on('connection', (socket: Socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Log authentication info for debugging
    console.log('Socket handshake auth:', socket.handshake.auth);
    console.log('Socket handshake query:', socket.handshake.query);
    
    // Get user ID from auth object
    const userId = socket.handshake.auth.user_id;
    
    if (!userId) {
      console.error('No user ID provided in socket auth');
      socket.disconnect();
      return;
    }
    
    console.log(`User connected with ID: ${userId}`);
    
    // Set up specific handlers for different functionality
    // Modify these calls to match the function signatures
    setupChatHandlers(socket, userId);
    setupGamesHandlers(socket, userId);
    setupFriendsHandlers(socket, userId);
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${userId} disconnected, cleaning up game sessions`);
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
  });
}

// Export default as well for backward compatibility
export default setupSockets;