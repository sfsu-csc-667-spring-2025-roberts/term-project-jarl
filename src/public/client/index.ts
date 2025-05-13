// src/public/client/index.ts

// Declare global window property for TypeScript
declare global {
  interface Window {
    USER_ID?: number;
  }
}

import './js/main';

// Export all client modules for webpack
export * from './socket/index';
export * from './js/lobby';
export * from './js/games';
export * from './js/friends';
export * from './chat/index';

// Import AppManager singleton for initialization
import AppManager from './appManager';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.USER_ID) {
    console.log('Creating socket for user', window.USER_ID);
  } else {
    console.warn('No USER_ID found in window object');
  }
  
  // Delay initialization slightly to ensure all dependencies are loaded
  setTimeout(() => {
    console.log('Client application initialized');
    AppManager.getInstance().init().catch(err => {
      console.error('Error during app initialization:', err);
    });
  }, 100);
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log('Document already loaded, initializing app');
  setTimeout(() => {
    AppManager.getInstance().init().catch(err => {
      console.error('Error during app initialization:', err);
    });
  }, 100);
}