// src/public/client/js/main.ts
import { io } from "socket.io-client";
import Game from "./games";

// Initialize the window namespace for utility functions
declare global {
  interface Window {
    utils: {
      showNotification: (message: string, type?: string) => void;
      getUserId: () => number;
    };
  }
}

// Utility functions
window.utils = {
  // Show notification
  showNotification: (message: string, type: string = 'info') => {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toast);

    // Initialize and show toast
    toast.classList.add('show');

    // Auto hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 3000);
  },

  // Get user ID from page
  getUserId: () => {
    const userIdAttr = document.body.getAttribute('data-user-id');
    if (userIdAttr) {
      return parseInt(userIdAttr, 10);
    }
    return 0;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Get the current user ID
  const userId = window.utils.getUserId();
  
  if (!userId) {
    console.warn('No user ID found - socket connections will not be established');
    return;
  }

  // Initialize socket connection
  const socket = io({
    auth: {
      user_id: userId
    }
  });

  // Socket connection events
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  // Page-specific initializations
  const currentPath = window.location.pathname;
  
  // Game page
  if (currentPath.startsWith('/games/')) {
    const gameInstance = new Game(socket);
    gameInstance.init();
  }
  
  // Chat functionality for global chat
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input') as HTMLInputElement;
  
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      
      if (message) {
        socket.emit('chat_message', {
          message: message,
          game_id: 'global'
        });
        chatInput.value = '';
      }
    });
    
    // Listen for chat messages
    socket.on('chat_message', (data) => {
      const chatMessages = document.getElementById('chat-messages');
      if (chatMessages) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        messageDiv.innerHTML = `
          <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
          <strong>${data.username}:</strong> ${data.message}
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    });
  }
  
  // Initialize modal functionality
  const modalTriggers = document.querySelectorAll('[data-bs-toggle="modal"]');
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = (trigger as HTMLElement).getAttribute('data-bs-target');
      const targetModal = document.querySelector(targetId as string);
      
      if (targetModal) {
        (targetModal as any).classList.add('show');
        document.body.classList.add('modal-open');
        
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop fade show';
        document.body.appendChild(backdrop);
      }
    });
  });
  
  // Modal close handlers
  document.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).matches('.modal-backdrop') || 
        (e.target as HTMLElement).matches('[data-bs-dismiss="modal"]')) {
      const modals = document.querySelectorAll('.modal.show');
      modals.forEach(modal => {
        (modal as HTMLElement).classList.remove('show');
      });
      
      document.body.classList.remove('modal-open');
      
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => {
        backdrop.remove();
      });
    }
  });
  
  // Handle join game button clicks
  const joinGameButtons = document.querySelectorAll('.join-game-btn');
  joinGameButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const gameId = (button as HTMLElement).getAttribute('data-game-id');
      if (gameId) {
        window.location.href = `/games/${gameId}`;
      }
    });
  });
  
  // Handle create game form submission
  const createGameForm = document.getElementById('create-game-form');
  if (createGameForm) {
    createGameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(createGameForm as HTMLFormElement);
      const gameData = {
        name: formData.get('gameName'),
        maxPlayers: formData.get('maxPlayers'),
        minBuyIn: formData.get('minBuyIn'),
        private: formData.get('private-game') === 'on'
      };
      
      // Send AJAX request to create game
      fetch('/games/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(gameData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = `/games/${data.game_id}`;
        } else {
          window.utils.showNotification(data.message || 'Error creating game', 'danger');
        }
      })
      .catch(error => {
        console.error('Error creating game:', error);
        window.utils.showNotification('Server error. Please try again.', 'danger');
      });
    });
  }
});