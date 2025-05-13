// src/public/client/socket/index.ts

declare const io: any;

declare global {
  interface Window {
    gameSocket: any;
  }
}

let socket: any = null;
let isInitializing = false;

export const initSocket = (): any => {
  // Prevent multiple initializations
  if (isInitializing) {
    console.log('Socket initialization already in progress');
    return socket;
  }
  
  // Return existing connected socket
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }
  
  isInitializing = true;
  
  try {
    // Get user ID from the body data attribute
    const userId = document.body.dataset.userId;
    
    if (!userId || userId === '0' || userId === '') {
      console.error('Invalid user ID for socket connection');
      throw new Error('User must be logged in to connect to socket');
    }
    
    console.log(`Initializing socket for user ${userId}`);
    
    // Disconnect existing socket if any
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    
    // Initialize new socket connection
    socket = io({
      auth: {
        user_id: parseInt(userId)
      },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      timeout: 5000,
      transports: ['websocket']  // Only use websocket to prevent multiple connections
    });
    
    // Socket connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      isInitializing = false;
    });
    
    socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      isInitializing = false;
    });
    
    socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
    });
    
    socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Successfully reconnected after ${attemptNumber} attempts`);
    });
    
    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect');
      isInitializing = false;
    });
    
    // Handle authentication errors
    socket.on('auth_error', (message: string) => {
      console.error('Socket authentication error:', message);
      window.location.href = '/signin';
    });
    
    // Handle duplicate connections
    socket.on('duplicate_connection', (message: string) => {
      console.warn('Duplicate connection detected:', message);
      // Don't create a new connection, use the existing one
    });
    
    // Make socket available globally
    window.gameSocket = socket;
    
    return socket;
  } catch (error) {
    isInitializing = false;
    throw error;
  }
};

// Helper function to ensure socket is initialized
export const getSocket = (): any => {
  if (!socket || !socket.connected) {
    return initSocket();
  }
  return socket;
};

// Initialize socket when DOM is loaded (only once)
if (!window.gameSocket) {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initSocket();
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setTimeout(() => {
        window.location.href = '/signin';
      }, 2000);
    }
  });
}

export default socket;