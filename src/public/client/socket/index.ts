// src/public/client/socket/index.ts

declare global {
  interface Window {
    io: any;
  }
}

let socket: any = null;

export const initSocket = (): any => {
  // If socket already exists and is connected, return it
  if (socket && socket.connected) {
    console.log('Socket already connected');
    return socket;
  }

  // Get user ID from the body data attribute
  const userDataElement = document.querySelector('body');
  if (!userDataElement || !userDataElement.dataset.userId) {
    console.error('User ID not found in body dataset');
    return null;
  }

  const userId = userDataElement.dataset.userId;
  
  if (!userId || userId === '0' || userId === '') {
    console.error('Invalid user ID for socket connection');
    return null;
  }
  
  console.log(`Creating socket for user ${userId}`);
  
  // Make sure Socket.IO is loaded
  if (!window.io) {
    console.error('Socket.io not loaded');
    return null;
  }
  
  // Create new socket connection
  socket = window.io({
    auth: {
      user_id: parseInt(userId)
    },
    reconnection: false,
    transports: ['websocket'],
    timeout: 10000
  });
  
  // Socket connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('connect_error', (error: Error) => {
    console.error('Socket connection error:', error);
  });
  
  socket.on('disconnect', (reason: string) => {
    console.log('Socket disconnected:', reason);
  });
  
  socket.on('auth_error', (message: string) => {
    console.error('Socket authentication error:', message);
    window.location.href = '/signin';
  });
  
  socket.on('duplicate_connection', (message: string) => {
    console.log('Duplicate connection detected');
  });
  
  return socket;
};

export const getSocket = (): any => {
  if (!socket) {
    return initSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  disconnectSocket();
});

export default { 
  initSocket, 
  getSocket, 
  disconnectSocket 
};