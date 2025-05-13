// src/public/client/appManager.ts
// Single entry point for all client-side initialization

import { initSocket, getSocket } from './socket/index';

declare const bootstrap: any;

class AppManager {
  private static instance: AppManager;
  private initialized = false;
  private socket: any = null;

  private constructor() {}

  public static getInstance(): AppManager {
    if (!AppManager.instance) {
      AppManager.instance = new AppManager();
    }
    return AppManager.instance;
  }

  public async init() {
    if (this.initialized) {
      console.log('App already initialized');
      return;
    }

    console.log('Initializing application...');
    this.initialized = true;

    try {
      // Wait for Bootstrap to be loaded
      await this.waitForBootstrap();
      
      // Initialize socket after Bootstrap is ready
      this.socket = initSocket();
      
      if (!this.socket) {
        console.error('Failed to initialize socket');
        return;
      }

      // Wait for socket to connect with a proper timeout
      try {
        await new Promise<boolean>((resolve, reject) => {
          if (this.socket.connected) {
            resolve(true);
          } else {
            const connectHandler = () => {
              this.socket.off('connect_error', errorHandler);
              resolve(true);
            };
            
            const errorHandler = (error: Error) => {
              this.socket.off('connect', connectHandler);
              reject(error);
            };
            
            this.socket.once('connect', connectHandler);
            this.socket.once('connect_error', errorHandler);
            
            // Timeout after 5 seconds
            setTimeout(() => {
              this.socket.off('connect', connectHandler);
              this.socket.off('connect_error', errorHandler);
              resolve(false); // Resolve with false instead of rejecting
            }, 5000);
          }
        });
      } catch (socketError) {
        console.warn('Socket connection issue:', socketError);
        // Continue anyway - we'll try to work without socket if needed
      }

      console.log('Socket connected, initializing modules...');

      // Initialize modules based on current page
      const path = window.location.pathname;

      if (path === '/' || path.includes('/lobby')) {
        await this.initLobby();
        this.initFunds(); // Initialize funds functionality on lobby page
      } else if (path.includes('/games/')) {
        await this.initGame();
        this.initFunds(); // Initialize funds functionality on game page too
      }

      // Always initialize chat if elements exist
      this.initChat();

    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }

  private waitForBootstrap(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        resolve();
        return;
      }
      
      console.log('Waiting for Bootstrap...');
      const checkBootstrap = setInterval(() => {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          clearInterval(checkBootstrap);
          console.log('Bootstrap loaded');
          resolve();
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkBootstrap);
        console.warn('Bootstrap load timeout');
        resolve();
      }, 5000);
    });
  }

  private async initLobby() {
    console.log('Initializing lobby...');
    
    try {
      // Use dynamic import
      const lobby = await import('./js/lobby');
      const Lobby = lobby.default;
      
      // Wait for Bootstrap to be fully loaded before initializing lobby
      await this.waitForBootstrap();
      
      if (typeof Lobby === 'function') {
        const lobbyInstance = new Lobby(this.socket);
        lobbyInstance.init();
      } else {
        console.error('Lobby is not a constructor');
      }
    } catch (error) {
      console.error('Error initializing lobby:', error);
    }
  }

  private async initGame() {
    console.log('Initializing game...');
    
    try {
      // Use dynamic import
      const game = await import('./js/games');
      const Game = game.default;
      
      if (typeof Game === 'function') {
        const gameInstance = new Game(this.socket);
        gameInstance.init();
      } else {
        console.error('Game is not a constructor');
      }
    } catch (error) {
      console.error('Error initializing game:', error);
    }
  }
  
  private initFunds() {
    console.log('Initializing funds functionality...');
    
    // Add funds form
    const addFundsForm = document.getElementById('add-funds-form');
    if (addFundsForm) {
      addFundsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const amountInput = document.getElementById('amount') as HTMLInputElement;
        const paymentMethodSelect = document.getElementById('payment-method') as HTMLSelectElement;
        
        if (!amountInput || !paymentMethodSelect) {
          this.showError('Form elements not found');
          return;
        }
        
        const amount = amountInput.value;
        const paymentMethod = paymentMethodSelect.value;
        
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
          this.showError('Please enter a valid amount');
          return;
        }
        
        try {
          console.log('Adding funds:', { amount, payment_method: paymentMethod });
          
          const response = await fetch('/funds/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: parseFloat(amount),
              payment_method: paymentMethod
            })
          });
          
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            throw new Error('Invalid response from server');
          }
          
          if (!response.ok) {
            console.log('Add funds response not OK:', response.status, JSON.stringify(data));
            throw new Error(`Server returned ${response.status}: ${data.message || 'Unknown error'}`);
          }
          
          if (data.success) {
            // Update balance display
            this.updateBalanceDisplay(data.balance);
            
            // Show success message
            this.showSuccess(`Successfully added $${parseFloat(amount).toFixed(2)} to your account`);
            
            // Hide modal
            this.closeModal('add-funds-modal');
            
            // Reset form
            (addFundsForm as HTMLFormElement).reset();
          } else {
            this.showError(data.message || 'Failed to add funds');
          }
        } catch (error) {
          console.error('Error adding funds:', error);
          this.showError('Failed to add funds. Please try again later.');
        }
      });
    }
    
    // Withdraw funds form
    const withdrawFundsForm = document.getElementById('withdraw-funds-form');
    if (withdrawFundsForm) {
      withdrawFundsForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const amountInput = document.getElementById('withdraw-amount') as HTMLInputElement;
        const amount = amountInput?.value;
        
        try {
          const response = await fetch('/funds/withdraw', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              amount: amount ? parseFloat(amount) : null
            })
          });
          
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('Error parsing JSON response:', jsonError);
            throw new Error('Invalid response from server');
          }
          
          if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${data.message || 'Unknown error'}`);
          }
          
          if (data.success) {
            // Update balance display
            this.updateBalanceDisplay(data.balance);
            
            // Show success message
            this.showSuccess(`Successfully withdrew $${parseFloat(data.amount).toFixed(2)} from your account`);
            
            // Hide modal
            this.closeModal('withdraw-funds-modal');
            
            // Reset form
            (withdrawFundsForm as HTMLFormElement).reset();
          } else {
            this.showError(data.message || 'Failed to withdraw funds');
          }
        } catch (error) {
          console.error('Error withdrawing funds:', error);
          this.showError('Failed to withdraw funds. Please try again later.');
        }
      });
    }
    
    // Load initial balance
    this.fetchAndDisplayBalance();
  }

  // Fetch and display user's balance
  private async fetchAndDisplayBalance() {
    try {
      const response = await fetch('/funds/balance');
      
      if (!response.ok) {
        console.error('Failed to fetch balance:', response.status);
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        this.updateBalanceDisplay(data.balance);
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }

  // Update balance display throughout the page
  private updateBalanceDisplay(balance: number) {
    const balanceElements = document.querySelectorAll('.user-balance');
    const formattedBalance = parseFloat(balance.toString()).toFixed(2);
    
    balanceElements.forEach(element => {
      if (element) {
        element.textContent = `$${formattedBalance}`;
      }
    });
  }

  // Show error message
  private showError(message: string) {
    const errorElement = document.getElementById('funds-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        if (errorElement) {
          errorElement.style.display = 'none';
        }
      }, 5000);
    } else {
      alert(`Error: ${message}`);
    }
  }

  // Show success message
  private showSuccess(message: string) {
    const successElement = document.getElementById('funds-success');
    if (successElement) {
      successElement.textContent = message;
      successElement.style.display = 'block';
      
      // Hide after 5 seconds
      setTimeout(() => {
        if (successElement) {
          successElement.style.display = 'none';
        }
      }, 5000);
    } else {
      alert(`Success: ${message}`);
    }
  }

  // Close modal
  private closeModal(modalId: string) {
    const modalElement = document.getElementById(modalId);
    if (modalElement && typeof bootstrap !== 'undefined') {
      const modal = bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    } else if (modalElement) {
      modalElement.style.display = 'none';
    }
  }

  private initChat() {
    console.log('Initializing chat...');
    
    // Initialize chat if elements exist
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    if (!chatForm || !chatInput || !chatMessages) {
      console.log('Chat elements not found, skipping chat initialization');
      return;
    }
    
    // Remove existing listeners
    const newChatForm = chatForm.cloneNode(true) as HTMLFormElement;
    chatForm.parentNode?.replaceChild(newChatForm, chatForm);
    
    const newChatInput = newChatForm.querySelector('#chat-input') as HTMLInputElement;
    if (!newChatInput) {
      console.error('Could not find chat input in cloned form');
      return;
    }
    
    newChatForm.onsubmit = (e) => {
      e.preventDefault();
      
      const message = newChatInput.value.trim();
      if (!message) return;
      
      if (this.socket && this.socket.connected) {
        this.socket.emit('chat_message', {
          message: message,
          game_id: 'global'
        });
        
        newChatInput.value = '';
      } else {
        console.error('Socket not connected, cannot send message');
        this.showError('Cannot send message: not connected to server');
      }
    };
    
    // Only listen once
    if (this.socket) {
      this.socket.off('chat_message');
      this.socket.on('chat_message', (data: any) => {
        if (!data || !data.username || !data.message) {
          console.error('Invalid chat message data received:', data);
          return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message mb-2';
        
        // Sanitize the message to prevent XSS
        const sanitizedMessage = this.sanitizeHTML(data.message);
        const sanitizedUsername = this.sanitizeHTML(data.username);
        
        messageDiv.innerHTML = `
          <div class="d-flex align-items-start">
            <div class="me-2">
              <strong>${sanitizedUsername}:</strong>
            </div>
            <div class="flex-grow-1">
              ${sanitizedMessage}
            </div>
            <small class="text-muted">${new Date(data.timestamp).toLocaleTimeString()}</small>
          </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }
  }
  
  // Simple HTML sanitizer to prevent XSS
  private sanitizeHTML(text: string): string {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
  }

  public getSocket() {
    return this.socket;
  }
}

// Initialize on DOM load with a small delay to ensure Bootstrap is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Add a small delay to ensure all scripts are loaded
  setTimeout(() => {
    AppManager.getInstance().init();
  }, 100);
});

// Also handle window.load in case DOMContentLoaded fires too early
window.addEventListener('load', () => {
  if (!AppManager.getInstance()['initialized']) {
    AppManager.getInstance().init();
  }
});

export default AppManager;