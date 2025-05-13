// src/public/client/js/lobby.ts

import { getSocket } from '../socket/index';

// Define types for responses
interface JoinGameResponse {
  success: boolean;
  error?: string;
  game_id?: number;
  player_count?: number;
  players?: string[];
  game_state?: string;
}

interface PlayerJoinedEvent {
  game_id: number;
  user_id: number;
  player_count: number;
  players?: string[];
  game_name?: string;
  created_by?: string;
}

interface PlayerLeftEvent {
  game_id: number;
  user_id: number;
  player_count: number;
  players?: string[];
  reason?: string;
}

interface ChatMessageData {
  username: string;
  message: string;
  timestamp: string;
  game_id: string;
}

interface GameInfoResponse {
  success: boolean;
  game?: any;
  error?: string;
}

// Prevent multiple initializations
let isInitialized = false;

// Initialize socket when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  if (isInitialized) {
    console.log('Lobby already initialized');
    return;
  }
  
  console.log('Lobby script loaded');
  isInitialized = true;
  
  let gameSocket: any;
  
  try {
    // Get existing socket
    gameSocket = getSocket();
  } catch (error) {
    console.error('Cannot get socket:', error);
    alert('Please log in to access the poker game.');
    window.location.href = '/signin';
    return;
  }
  
  // Wait for socket to connect before proceeding
  if (!gameSocket.connected) {
    const connectListener = () => {
      gameSocket.off('connect', connectListener);
      initLobbyFunctionality();
    };
    gameSocket.on('connect', connectListener);
  } else {
    initLobbyFunctionality();
  }
  
  function initLobbyFunctionality() {
    console.log('Initializing lobby functionality');
    
    // Initialize Bootstrap modals
    let createGameModal: any;
    let addFundsModal: any;
    let joinGameModal: any;
    
    try {
      createGameModal = new (window as any).bootstrap.Modal(document.getElementById('create-game-modal'));
      addFundsModal = new (window as any).bootstrap.Modal(document.getElementById('add-funds-modal'));
      joinGameModal = new (window as any).bootstrap.Modal(document.getElementById('join-game-modal'));
    } catch (error) {
      console.error('Error initializing modals:', error);
    }
    
    // Event listeners for buttons
    const createGameBtn = document.getElementById('create-game-btn');
    if (createGameBtn) {
      createGameBtn.addEventListener('click', () => {
        createGameModal.show();
      });
    }
    
    const createGameModalBtn = document.getElementById('create-game-modal-btn');
    if (createGameModalBtn) {
      createGameModalBtn.addEventListener('click', () => {
        createGameModal.show();
      });
    }
    
    const addFundsBtn = document.getElementById('add-funds-btn');
    if (addFundsBtn) {
      addFundsBtn.addEventListener('click', () => {
        addFundsModal.show();
      });
    }
    
    const joinGameModalBtn = document.getElementById('join-game-modal-btn');
    if (joinGameModalBtn) {
      joinGameModalBtn.addEventListener('click', () => {
        joinGameModal.show();
      });
    }
    
    // Create Game Form Handler
    const createGameForm = document.getElementById('create-game-form') as HTMLFormElement;
    if (createGameForm) {
      createGameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target as HTMLFormElement);
        const data = {
          name: formData.get('game-name') as string,
          maxPlayers: parseInt(formData.get('max-players') as string),
          minBuyIn: formData.get('min-buy-in') ? parseInt(formData.get('min-buy-in') as string) : undefined,
          private: formData.get('private-game') === 'on'
        };
        
        if (!data.name || isNaN(data.maxPlayers)) {
          alert('Please fill in all required fields');
          return;
        }
        
        try {
          const response = await fetch('/games/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          
          if (result.success) {
            createGameModal.hide();
            window.location.href = `/games/${result.game_id}`;
          } else {
            alert(result.message || 'Failed to create game');
          }
        } catch (error) {
          console.error('Error creating game:', error);
          alert('Error creating game. Please try again.');
        }
      });
    }
    
    // Add Funds Form Handler
    const addFundsForm = document.getElementById('add-funds-form') as HTMLFormElement;
    if (addFundsForm) {
      addFundsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target as HTMLFormElement);
        const amount = parseFloat(formData.get('amount') as string);
        const paymentMethod = formData.get('payment-method') as string;
        
        if (isNaN(amount) || amount < 10) {
          alert('Please enter a valid amount (minimum $10)');
          return;
        }
        
        if (!paymentMethod) {
          alert('Please select a payment method');
          return;
        }
        
        try {
          const response = await fetch('/funds/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: amount,
              payment_method: paymentMethod
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            addFundsModal.hide();
            window.location.reload();
          } else {
            alert(result.message || 'Failed to add funds');
          }
        } catch (error) {
          console.error('Error adding funds:', error);
          alert('Error processing payment. Please try again.');
        }
      });
    }
    
    // Join Game Form Handler (in modal)
    const joinGameForm = document.getElementById('join-game-form') as HTMLFormElement;
    if (joinGameForm) {
      joinGameForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target as HTMLFormElement);
        const gameId = formData.get('game-id') as string;
        
        if (!gameId || isNaN(parseInt(gameId))) {
          alert('Please enter a valid game ID');
          return;
        }
        
        // Use socket to join game with proper callback
        gameSocket.emit('join_game', parseInt(gameId), (response: JoinGameResponse) => {
          if (response && response.success) {
            joinGameModal.hide();
            window.location.href = `/games/${gameId}`;
          } else {
            alert(response?.error || 'Failed to join game');
          }
        });
      });
    }
    
    // Quick join game buttons in the games list
    document.querySelectorAll('.join-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const target = e.target as HTMLElement;
        const gameId = target.dataset.id;
        
        if (!gameId) {
          console.error('No game ID found');
          return;
        }
        
        // Check if button is disabled
        if (target.hasAttribute('disabled')) {
          return;
        }
        
        // Show loading state
        const originalText = target.textContent;
        target.textContent = 'Joining...';
        target.setAttribute('disabled', 'true');
        
        // Send join_game event via socket with proper gameId conversion
        gameSocket.emit('join_game', parseInt(gameId), (response: JoinGameResponse) => {
          // Restore button state
          target.textContent = originalText;
          target.removeAttribute('disabled');
          
          if (response && response.success) {
            window.location.href = `/games/${gameId}`;
          } else {
            alert(response?.error || 'Failed to join game');
          }
        });
      });
    });
    
    // Game details buttons
    document.querySelectorAll('.detail-btn').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const target = e.target as HTMLElement;
        const gameId = target.dataset.id;
        
        if (!gameId) {
          return;
        }
        
        // Get game info via socket
        gameSocket.emit('get_game_info', parseInt(gameId), (response: GameInfoResponse) => {
          if (response && response.success && response.game) {
            const game = response.game;
            const playerList = game.players
              .filter((p: any) => p.username)
              .map((p: any) => p.username)
              .join(', ');
            
            alert(`Game Details:\n` +
                  `Name: ${game.name}\n` +
                  `State: ${game.state}\n` +
                  `Players: ${game.current_players}/${game.max_players}\n` +
                  `Created by: ${game.creator_name}\n` +
                  `Players in game: ${playerList || 'None'}`);
          } else {
            alert('Error getting game details');
          }
        });
      });
    });
    
    // Cash Out Button Handler
    const cashOutBtn = document.getElementById('cash-out-btn');
    if (cashOutBtn) {
      cashOutBtn.addEventListener('click', async () => {
        if (!confirm('Are you sure you want to cash out all your funds?')) {
          return;
        }
        
        try {
          const response = await fetch('/funds/withdraw', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          const result = await response.json();
          
          if (result.success) {
            window.location.reload();
          } else {
            alert(result.message || 'Cash out failed');
          }
        } catch (error) {
          console.error('Error during cash out:', error);
          alert('Error processing cash out. Please try again.');
        }
      });
    }
    
    // Chat functionality
    const chatForm = document.getElementById('chat-form') as HTMLFormElement;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    const chatMessages = document.getElementById('chat-messages') as HTMLElement;
    
    if (chatForm && chatInput && chatMessages) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const message = chatInput.value.trim();
        if (!message) return;
        
        // Send chat message
        gameSocket.emit('chat_message', {
          message: message,
          game_id: 'global'
        });
        
        // Clear input
        chatInput.value = '';
      });
      
      // Listen for chat messages
      gameSocket.on('chat_message', (data: ChatMessageData) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message mb-2';
        messageDiv.innerHTML = `
          <div class="d-flex align-items-start">
            <div class="me-2">
              <strong>${data.username}:</strong>
            </div>
            <div class="flex-grow-1">
              ${data.message}
            </div>
            <small class="text-muted">${new Date(data.timestamp).toLocaleTimeString()}</small>
          </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      });
    }
    
    // Listen for player join/leave events
    gameSocket.on('player_joined', (data: PlayerJoinedEvent) => {
      console.log('Player joined:', data);
      updateGamesList();
    });
    
    gameSocket.on('player_left', (data: PlayerLeftEvent) => {
      console.log('Player left:', data);
      updateGamesList();
    });
    
    // Function to update games list
    let updateTimeout: number | undefined;
    function updateGamesList() {
      if (updateTimeout) {
        window.clearTimeout(updateTimeout);
      }
      updateTimeout = window.setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
    
    // Chat tab switching
    document.querySelectorAll('[data-chat]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        const target = e.target as HTMLElement;
        
        // Update active tab
        document.querySelectorAll('[data-chat]').forEach(t => t.classList.remove('active'));
        target.classList.add('active');
        
        // Update chat room
        const chatType = target.dataset.chat;
        if (chatType === 'global') {
          // Show global chat
          if (chatMessages) chatMessages.style.display = 'block';
          if (chatForm) chatForm.style.display = 'flex';
        }
      });
    });
  }
});