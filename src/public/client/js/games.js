// src/public/client/js/games.js
// Example client-side code to handle game interactions

class Game {
  constructor(socket) {
    this.socket = socket;
    this.gameId = null;
    this.players = [];
    this.currentSeat = null;
    this.initialized = false;
  }

  init() {
    console.log('Initializing game functionality...');
    
    if (this.initialized) {
      console.log('Game already initialized');
      return;
    }
    
    this.initialized = true;
    
    // Extract game ID from URL
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'games') {
      this.gameId = parseInt(pathParts[2], 10);
      console.log(`Game ID from URL: ${this.gameId}`);
    }
    
    // Set up socket event listeners
    this.setupSocketListeners();
    
    // Set up UI event listeners
    this.setupUIListeners();
    
    // Join game if ID is available
    if (this.gameId) {
      this.joinGame(this.gameId);
    }
  }
  
  setupSocketListeners() {
    if (!this.socket) {
      console.error('Socket not available');
      return;
    }
    
    // Game joined event
    this.socket.on('game_joined', (data) => {
      console.log('Game joined:', data);
      this.gameId = data.game_id;
      this.currentSeat = data.seat;
      
      // Update UI
      this.updateGameState();
      
      // Hide any loading or waiting screens
      const waitingElement = document.querySelector('.waiting-screen');
      if (waitingElement) {
        waitingElement.style.display = 'none';
      }
    });
    
    // Player joined event
    this.socket.on('player_joined', (data) => {
      console.log('Player joined:', data);
      
      // Add player to the list if not already there
      if (!this.players.some(p => p.user_id === data.user_id)) {
        this.players.push(data);
      }
      
      // Update UI
      this.updatePlayersList();
    });
    
    // Player left event
    this.socket.on('player_left', (data) => {
      console.log('Player left:', data);
      
      // Remove player from the list
      this.players = this.players.filter(p => p.user_id !== data.user_id);
      
      // Update UI
      this.updatePlayersList();
    });
    
    // Game error event
    this.socket.on('game_error', (data) => {
      console.error('Game error:', data);
      
      // Display error message
      this.showError(data.message);
    });
    
    // Game left event
    this.socket.on('game_left', (data) => {
      console.log('Game left:', data);
      
      if (data.forced) {
        // This was a forced leave (e.g., not in game)
        console.log('Forced game leave, updating client state');
        
        // Still update UI to prevent weird states
        if (data.error) {
          this.showError('Error leaving game, but state has been updated');
        }
      }
      
      // Redirect to lobby if not already there
      if (window.location.pathname !== '/lobby') {
        window.location.href = '/lobby';
      }
    });
    
    // Game state update
    this.socket.on('game_state', (data) => {
      console.log('Game state update:', data);
      
      // Update local game state
      this.players = data.players || [];
      
      // Update UI
      this.updateGameState();
    });
  }
  
  setupUIListeners() {
    // Start game button
    const startGameBtn = document.getElementById('start-game-btn');
    if (startGameBtn) {
      startGameBtn.addEventListener('click', () => {
        if (!this.gameId) {
          this.showError('No game joined');
          return;
        }
        
        this.socket.emit('start_game', this.gameId);
      });
    }
    
    // Leave game button
    const leaveGameBtn = document.querySelector('.leave-game-btn');
    if (leaveGameBtn) {
      leaveGameBtn.addEventListener('click', () => {
        if (!this.gameId) {
          console.warn('No game to leave, redirecting to lobby');
          window.location.href = '/lobby';
          return;
        }
        
        this.leaveGame();
      });
    }
    
    // Add more UI listeners as needed
  }
  
  joinGame(gameId, buyIn = null) {
    if (!this.socket) {
      this.showError('Socket not connected');
      return;
    }
    
    console.log(`Joining game ${gameId}`);
    
    this.socket.emit('join_game', {
      gameId: gameId,
      buyIn: buyIn
    });
  }
  
  leaveGame() {
    if (!this.socket || !this.gameId) {
      this.showError('Not in a game');
      return;
    }
    
    console.log(`Leaving game ${this.gameId}`);
    
    this.socket.emit('leave_game', this.gameId);
  }
  
  updateGameState() {
    // Update the game UI based on current state
    // This is a placeholder - implement based on your UI structure
    
    // Update current player
    const playerNameElement = document.querySelector('.player-name');
    if (playerNameElement) {
      playerNameElement.textContent = `Seat ${this.currentSeat || '?'}`;
    }
    
    // Update players list
    this.updatePlayersList();
    
    // Update pot amount
    const potElement = document.querySelector('.pot-amount');
    if (potElement) {
      // Assuming pot amount is stored somewhere
      potElement.textContent = `Pot: ${this.pot || 0} chips`;
    }
  }
  
  updatePlayersList() {
    // Update the players list in the UI
    // This is a placeholder - implement based on your UI structure
    const playersListElement = document.querySelector('.players-list');
    if (!playersListElement) return;
    
    playersListElement.innerHTML = '';
    
    this.players.forEach(player => {
      const playerElement = document.createElement('div');
      playerElement.className = 'player';
      playerElement.dataset.seat = player.seat;
      playerElement.dataset.userId = player.user_id;
      
      playerElement.innerHTML = `
        <div class="player-name">${player.username || 'Unknown'}</div>
        <div class="player-stack">$${player.stack}</div>
        <div class="player-status">${player.status}</div>
      `;
      
      playersListElement.appendChild(playerElement);
    });
  }
  
  showError(message) {
    // Display error message to user
    console.error('Game error:', message);
    
    // Use existing error display element or create a modal
    const errorElement = document.getElementById('game-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
      
      // Hide after a delay
      setTimeout(() => {
        errorElement.style.display = 'none';
      }, 5000);
    } else {
      // Fallback to alert if no error display element
      alert(`Game Error: ${message}`);
    }
  }
}

export default Game;