// src/public/client/js/games.ts

class Game {
  private socket: any;
  private initialized = false;
  private gameId: string;
  private userId: number;
  private username: string;
  private players: any[] = [];
  private gameState: string = 'WAITING';
  private myCards: string[] = [];
  private communityCards: string[] = [];

  constructor(socket: any) {
    this.socket = socket;
    this.gameId = this.getGameIdFromPage();
    this.userId = this.getUserIdFromPage();
    this.username = this.getUsernameFromPage();
    
    console.log(`Game initialized with ID: ${this.gameId}, User ID: ${this.userId}, Username: ${this.username}`);
  }

  init() {
    if (this.initialized) {
      console.log('Game already initialized');
      return;
    }

    console.log('Initializing game functionality...');
    this.initialized = true;

    this.setupSocketListeners();
    this.initStartLeaveButtons();
    this.initChatFunctionality();
    this.initGameControls();
    
    // Join the game on initialization
    this.joinCurrentGame();
  }

  private getGameIdFromPage(): string {
    const gameBoard = document.getElementById('game-board');
    return gameBoard?.dataset.gameId || '';
  }

  private getUserIdFromPage(): number {
    const userIdStr = document.body.dataset.userId || '0';
    return parseInt(userIdStr, 10);
  }
  
  private getUsernameFromPage(): string {
    return document.body.dataset.username || 'Player';
  }

  private joinCurrentGame() {
    if (!this.gameId) {
      console.error('No game ID found');
      return;
    }

    console.log(`Attempting to join game ${this.gameId}...`);
    this.socket.emit('join_game', this.gameId, (response: any) => {
      if (response.success) {
        console.log(`Successfully joined game ${this.gameId}`, response);
        
        if (response.players) {
          this.players = response.players;
          this.updatePlayerPositions(response.players);
        }
        
        if (response.game) {
          this.gameState = response.game.state;
          this.updateGameState(response.game);
        }
      } else {
        console.error(`Failed to join game: ${response.error}`);
        alert(`Error joining game: ${response.error}`);
        window.location.href = '/';
      }
    });
  }

  private updatePlayerPositions(players: any[]) {
    // Clear existing players
    document.querySelectorAll('.player-position').forEach(position => {
      position.innerHTML = '';
      position.classList.remove('occupied');
    });
    
    // Add players to their positions
    players.forEach(player => {
      const position = player.seat;
      const isCurrentPlayer = player.id === this.userId;
      
      const playerElement = document.querySelector(`.player-position[data-seat="${position}"]`);
      
      if (playerElement) {
        playerElement.classList.add('occupied');
        playerElement.innerHTML = `
          <div class="player ${isCurrentPlayer ? 'is-me' : ''}">
            <div class="player-name">${player.username || 'Player'}</div>
            <div class="player-chips">${player.chips || 1000}</div>
          </div>
        `;
      }
    });
  }

  private updateGameState(game: any) {
    const waitingMessage = document.querySelector('.waiting-message');
    const actionButtons = document.querySelectorAll('.action-buttons button');
    
    if (game.state === 'ACTIVE') {
      // Hide waiting message
      if (waitingMessage) {
        waitingMessage.classList.add('d-none');
      }
      
      // Show action buttons
      actionButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'inline-block';
      });
      
      // Update game UI
      const startButton = document.getElementById('start-game');
      if (startButton) {
        startButton.style.display = 'none';
      }
    } else {
      // Show waiting message
      if (waitingMessage) {
        waitingMessage.classList.remove('d-none');
      }
      
      // Hide action buttons
      actionButtons.forEach(btn => {
        (btn as HTMLElement).style.display = 'none';
      });
    }
  }

  private initStartLeaveButtons() {
    // Start game button
    const startGameBtn = document.getElementById('start-game');
    if (startGameBtn) {
      startGameBtn.addEventListener('click', () => {
        console.log('Attempting to start game...');
        this.socket.emit('start_game', this.gameId, (response: any) => {
          if (response.success) {
            console.log('Game started successfully!');
          } else {
            alert(`Failed to start game: ${response.error || 'Unknown error'}`);
          }
        });
      });
    }
    
    // Leave game button
    const leaveGameBtn = document.getElementById('leave-game-btn');
    if (leaveGameBtn) {
      leaveGameBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to leave the game?')) {
          console.log(`Attempting to leave game ${this.gameId}...`);
          
          this.socket.emit('leave_game', this.gameId, (response: any) => {
            if (response.success) {
              window.location.href = '/';
            } else {
              alert(`Error leaving game: ${response.error || 'Unknown error'}`);
            }
          });
        }
      });
    }
  }

  private initChatFunctionality() {
    const chatForm = document.getElementById('chat-form') as HTMLFormElement;
    const chatInput = document.getElementById('chat-input') as HTMLInputElement;
    
    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        
        if (message) {
          this.socket.emit('send_message', {
            game_id: this.gameId,
            message: message
          });
          chatInput.value = '';
        }
      });
    }
  }

  private initGameControls() {
    // Game action buttons (check, call, fold, etc.)
    const checkBtn = document.getElementById('check-btn');
    const callBtn = document.getElementById('call-btn');
    const foldBtn = document.getElementById('fold-btn');
    const betBtn = document.getElementById('bet-btn');
    const raiseBtn = document.getElementById('raise-btn');
    const allInBtn = document.getElementById('all-in-btn');
    
    const betAmount = document.getElementById('bet-amount') as HTMLInputElement;
    
    // Add click handlers
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        this.sendGameAction('check');
      });
    }
    
    if (callBtn) {
      callBtn.addEventListener('click', () => {
        this.sendGameAction('call');
      });
    }
    
    if (foldBtn) {
      foldBtn.addEventListener('click', () => {
        this.sendGameAction('fold');
      });
    }
    
    if (betBtn && betAmount) {
      betBtn.addEventListener('click', () => {
        const amount = parseInt(betAmount.value);
        if (isNaN(amount) || amount <= 0) {
          alert('Please enter a valid bet amount');
          return;
        }
        this.sendGameAction('bet', amount);
      });
    }
    
    if (raiseBtn && betAmount) {
      raiseBtn.addEventListener('click', () => {
        const amount = parseInt(betAmount.value);
        if (isNaN(amount) || amount <= 0) {
          alert('Please enter a valid raise amount');
          return;
        }
        this.sendGameAction('raise', amount);
      });
    }
    
    if (allInBtn) {
      allInBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to go all in?')) {
          this.sendGameAction('all_in');
        }
      });
    }
  }

  private sendGameAction(action: string, amount?: number) {
    const data: any = {
      game_id: this.gameId,
      action: action
    };
    
    if (amount !== undefined) {
      data.amount = amount;
    }
    
    this.socket.emit('game_action', data, (response: any) => {
      if (!response.success) {
        alert(`Error: ${response.error || 'Unknown error'}`);
      }
    });
  }

  private setupSocketListeners() {
    // Player joined event
    this.socket.on('player_joined', (data: any) => {
      console.log('Player joined:', data);
      if (data.players) {
        this.players = data.players;
        this.updatePlayerPositions(data.players);
      }
    });
    
    // Player left event
    this.socket.on('player_left', (data: any) => {
      console.log('Player left:', data);
      if (data.players) {
        this.players = data.players;
        this.updatePlayerPositions(data.players);
      }
    });
    
    // Game started event
    this.socket.on('game_started', (data: any) => {
      console.log('Game started:', data);
      this.gameState = 'ACTIVE';
      
      if (data.players) {
        this.players = data.players;
        this.updatePlayerPositions(data.players);
      }
      
      if (data.communityCards) {
        this.communityCards = data.communityCards;
        this.displayCommunityCards(data.communityCards);
      }
      
      // Update UI
      this.updateGameState({ state: 'ACTIVE' });
    });
    
    // Cards dealt event
    this.socket.on('cards_dealt', (data: any) => {
      console.log('Cards dealt:', data);
      if (data.cards) {
        this.myCards = data.cards;
        this.displayPlayerCards(data.cards);
      }
    });
    
    // Player action event
    this.socket.on('player_action', (data: any) => {
      console.log('Player action:', data);
      this.addActionMessage(data);
    });
    
    // Chat message event
    this.socket.on('chat_message', (data: any) => {
      console.log('Chat message:', data);
      this.addChatMessage(data);
    });
  }

  private displayPlayerCards(cards: string[]) {
    const playerHand = document.getElementById('player-hand');
    if (!playerHand) return;
    
    playerHand.innerHTML = '';
    
    cards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = 'card';
      
      // Extract rank and suit
      const rank = card.slice(0, -1);
      const suit = card.slice(-1);
      
      let suitSymbol = '';
      let suitColor = '';
      
      switch (suit) {
        case 'h':
          suitSymbol = '♥';
          suitColor = 'red';
          break;
        case 'd':
          suitSymbol = '♦';
          suitColor = 'red';
          break;
        case 'c':
          suitSymbol = '♣';
          suitColor = 'black';
          break;
        case 's':
          suitSymbol = '♠';
          suitColor = 'black';
          break;
      }
      
      cardElement.innerHTML = `
        <div class="card-inner ${suitColor}">
          <div class="card-rank">${rank}</div>
          <div class="card-suit">${suitSymbol}</div>
        </div>
      `;
      
      playerHand.appendChild(cardElement);
    });
  }

  private displayCommunityCards(cards: string[]) {
    const communityCards = document.getElementById('community-cards');
    if (!communityCards) return;
    
    communityCards.innerHTML = '';
    
    cards.forEach(card => {
      const cardElement = document.createElement('div');
      cardElement.className = 'card';
      
      // Extract rank and suit
      const rank = card.slice(0, -1);
      const suit = card.slice(-1);
      
      let suitSymbol = '';
      let suitColor = '';
      
      switch (suit) {
        case 'h':
          suitSymbol = '♥';
          suitColor = 'red';
          break;
        case 'd':
          suitSymbol = '♦';
          suitColor = 'red';
          break;
        case 'c':
          suitSymbol = '♣';
          suitColor = 'black';
          break;
        case 's':
          suitSymbol = '♠';
          suitColor = 'black';
          break;
      }
      
      cardElement.innerHTML = `
        <div class="card-inner ${suitColor}">
          <div class="card-rank">${rank}</div>
          <div class="card-suit">${suitSymbol}</div>
        </div>
      `;
      
      communityCards.appendChild(cardElement);
    });
  }

  private addActionMessage(data: any) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message game-action';
    
    let actionText = '';
    switch (data.action) {
      case 'check':
        actionText = 'checks';
        break;
      case 'call':
        actionText = `calls ${data.amount || 0}`;
        break;
      case 'fold':
        actionText = 'folds';
        break;
      case 'bet':
        actionText = `bets ${data.amount || 0}`;
        break;
      case 'raise':
        actionText = `raises to ${data.amount || 0}`;
        break;
      case 'all_in':
        actionText = 'goes ALL IN!';
        break;
      default:
        actionText = data.action;
    }
    
    messageElement.innerHTML = `
      <span class="timestamp">${new Date().toLocaleTimeString()}</span>
      <strong class="action-player">${data.username || 'Player'}</strong> ${actionText}
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  private addChatMessage(data: any) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message';
    
    // Check if it's the current user's message
    if (data.user_id === this.userId) {
      messageElement.classList.add('my-message');
    }
    
    messageElement.innerHTML = `
      <span class="timestamp">${new Date(data.timestamp || Date.now()).toLocaleTimeString()}</span>
      <strong>${data.username || 'Unknown'}:</strong> ${data.message}
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

export default Game;