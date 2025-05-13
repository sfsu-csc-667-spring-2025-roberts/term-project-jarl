// src/public/client/js/games.ts

import { getSocket } from '../socket/index';

// Initialize socket when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get user ID from the body data attribute
  const userId = document.body.dataset.userId || '0';
  
  // Initialize socket connection
  const socket: any = getSocket();
  
  // Socket connection event handlers
  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });
  
  socket.on('disconnect', (reason: string) => {
    console.log('Socket disconnected:', reason);
  });
  
  // Function to handle card interaction
  function initCardInteraction() {
    const playerCards = document.querySelector('.player-cards');
    const communityCards = document.querySelector('.community-cards');
    
    if (playerCards) {
      playerCards.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('card')) {
          target.classList.toggle('selected');
        }
      });
    }
  }
  
  // Initialize game controls
  function initGameControls() {
    const checkBtn = document.getElementById('check-btn');
    const betBtn = document.getElementById('bet-btn');
    const callBtn = document.getElementById('call-btn');
    const raiseBtn = document.getElementById('raise-btn');
    const foldBtn = document.getElementById('fold-btn');
    const allInBtn = document.getElementById('all-in-btn');
    
    if (checkBtn) {
      checkBtn.addEventListener('click', () => {
        socket.emit('game_action', { action: 'check' });
      });
    }
    
    if (callBtn) {
      callBtn.addEventListener('click', () => {
        socket.emit('game_action', { action: 'call' });
      });
    }
    
    if (foldBtn) {
      foldBtn.addEventListener('click', () => {
        socket.emit('game_action', { action: 'fold' });
      });
    }
    
    if (betBtn || raiseBtn) {
      const betButton = betBtn || raiseBtn;
      const betAmountInput = document.getElementById('bet-amount') as HTMLInputElement;
      
      betButton.addEventListener('click', () => {
        if (betAmountInput) {
          const amount = parseInt(betAmountInput.value);
          if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid bet amount');
            return;
          }
          
          const action = betBtn ? 'bet' : 'raise';
          socket.emit('game_action', { action, amount });
        }
      });
    }
    
    if (allInBtn) {
      allInBtn.addEventListener('click', () => {
        socket.emit('game_action', { action: 'all_in' });
      });
    }
  }
  
  // Listen for game updates
  socket.on('game_update', (data: any) => {
    console.log('Game update:', data);
    updateGameUI(data);
  });
  
  // Function to update game UI
  function updateGameUI(gameData: any) {
    // Update pot
    const potDisplay = document.querySelector('.pot-amount');
    if (potDisplay && gameData.pot) {
      potDisplay.textContent = `$${gameData.pot}`;
    }
    
    // Update player info
    const players = gameData.players || [];
    players.forEach((player: any, index: number) => {
      const playerElement = document.querySelector(`.player-${index + 1}`);
      if (playerElement) {
        // Update chips
        const chipsElement = playerElement.querySelector('.player-chips');
        if (chipsElement) {
          chipsElement.textContent = `$${player.chips}`;
        }
        
        // Update bet
        const betElement = playerElement.querySelector('.player-bet');
        if (betElement) {
          betElement.textContent = player.currentBet ? `$${player.currentBet}` : '';
        }
        
        // Update active player indicator
        if (player.isActive) {
          playerElement.classList.add('active-player');
        } else {
          playerElement.classList.remove('active-player');
        }
      }
    });
    
    // Update community cards
    if (gameData.communityCards) {
      const communityCardsContainer = document.querySelector('.community-cards');
      if (communityCardsContainer) {
        communityCardsContainer.innerHTML = '';
        gameData.communityCards.forEach((card: any) => {
          const cardElement = document.createElement('div');
          cardElement.className = 'card';
          cardElement.innerHTML = `
            <span class="card-rank">${card.rank}</span>
            <span class="card-suit">${card.suit}</span>
          `;
          communityCardsContainer.appendChild(cardElement);
        });
      }
    }
  }
  
  // Initialize all game functionality
  initCardInteraction();
  initGameControls();
  
  // Handle game events
  socket.on('game_started', (data: any) => {
    console.log('Game started:', data);
    // Show game UI, hide waiting message, etc.
  });
  
  socket.on('game_ended', (data: any) => {
    console.log('Game ended:', data);
    // Show results modal or redirect
  });
  
  socket.on('player_action', (data: any) => {
    console.log('Player action:', data);
    // Update UI to show player action
  });
  
  // Leave game handler
  const leaveGameBtn = document.getElementById('leave-game-btn');
  if (leaveGameBtn) {
    leaveGameBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to leave the game?')) {
        const gameId = window.location.pathname.split('/').pop();
        socket.emit('leave_game', gameId, (response: any) => {
          if (response.success) {
            window.location.href = '/';
          } else {
            alert('Error leaving game: ' + (response.error || 'Unknown error'));
          }
        });
      }
    });
  }
});