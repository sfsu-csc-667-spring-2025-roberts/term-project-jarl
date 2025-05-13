// Add this to your public/js/main.js file or create it if it doesn't exist

document.addEventListener('DOMContentLoaded', function() {
  const userId = document.body.dataset.userId;
  const gameId = document.body.dataset.gameId;
  
  if (!userId) {
    console.error('No user ID found');
    return;
  }
  
  // Initialize socket
  const socket = io({
    auth: {
      user_id: userId
    }
  });
  
  // Socket connection events
  socket.on('connect', function() {
    console.log('Socket connected');
    
    // If on a game page, join the game
    if (gameId) {
      joinGame(gameId);
    }
  });
  
  // Handle joining a game
  function joinGame(id) {
    console.log('Attempting to join game ' + id);
    socket.emit('join_game', id, function(response) {
      if (response.success) {
        console.log('Successfully joined game ' + id);
        
        // Update player positions if available
        if (response.players) {
          updatePlayerPositions(response.players);
        }
      } else {
        console.error('Failed to join game:', response.error);
        alert('Error joining game: ' + response.error);
      }
    });
  }
  
  // Update player positions on the game board
  function updatePlayerPositions(players) {
    document.querySelectorAll('.player-position').forEach(position => {
      position.innerHTML = '';
      position.classList.remove('occupied');
    });
    
    players.forEach(player => {
      const position = player.seat;
      const isCurrentPlayer = player.id == userId;
      
      const playerElement = document.querySelector(`.player-position[data-seat="${position}"]`);
      
      if (playerElement) {
        playerElement.classList.add('occupied');
        playerElement.innerHTML = `
          <div class="player ${isCurrentPlayer ? 'is-me' : ''}">
            <div class="player-name">${player.username || 'Player'}</div>
            <div class="player-chips">$${player.chips || 1000}</div>
          </div>
        `;
      }
    });
  }
  
  // Handle leave game button click
  const leaveGameBtn = document.getElementById('leave-game-btn');
  if (leaveGameBtn) {
    leaveGameBtn.addEventListener('click', function() {
      if (confirm('Are you sure you want to leave the game?')) {
        console.log('Attempting to leave game ' + gameId);
        
        socket.emit('leave_game', gameId, function(response) {
          if (response.success) {
            window.location.href = '/';
          } else {
            alert('Error leaving game: ' + (response.error || 'Unknown error'));
          }
        });
      }
    });
  }
  
  // Handle start game button click
  const startGameBtn = document.getElementById('start-game');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', function() {
      console.log('Attempting to start game ' + gameId);
      
      socket.emit('start_game', gameId, function(response) {
        if (response.success) {
          console.log('Game started successfully!');
          startGameBtn.style.display = 'none';
          
          // Show waiting message while cards are dealt
          document.querySelector('.waiting-message')?.classList.remove('d-none');
        } else {
          alert('Failed to start game: ' + (response.error || 'Unknown error'));
        }
      });
    });
  }
  
  // Socket event handlers
  socket.on('player_joined', function(data) {
    console.log('Player joined:', data);
    if (data.players) {
      updatePlayerPositions(data.players);
    }
  });
  
  socket.on('player_left', function(data) {
    console.log('Player left:', data);
    if (data.players) {
      updatePlayerPositions(data.players);
    }
  });
  
  socket.on('game_started', function(data) {
    console.log('Game started:', data);
    
    // Hide waiting message
    document.querySelector('.waiting-message')?.classList.add('d-none');
    
    // Show action buttons
    document.querySelectorAll('.action-buttons button').forEach(btn => {
      btn.style.display = 'inline-block';
    });
    
    // Display community cards if available
    if (data.communityCards) {
      displayCommunityCards(data.communityCards);
    }
  });
  
  socket.on('cards_dealt', function(data) {
    console.log('Cards dealt:', data);
    if (data.cards) {
      displayPlayerCards(data.cards);
    }
  });
  
  // Display player cards
  function displayPlayerCards(cards) {
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
  
  // Display community cards
  function displayCommunityCards(cards) {
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
  
  // Chat functionality
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  
  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const message = chatInput.value.trim();
      
      if (message) {
        socket.emit('chat_message', {
          message: message,
          game_id: gameId || 'global'
        });
        chatInput.value = '';
      }
    });
  }
  
  socket.on('chat_message', function(data) {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
      const messageElement = document.createElement('div');
      messageElement.className = 'chat-message';
      
      if (data.user_id == userId) {
        messageElement.classList.add('my-message');
      }
      
      messageElement.innerHTML = `
        <span class="timestamp">${new Date(data.timestamp).toLocaleTimeString()}</span>
        <strong>${data.username || 'Unknown'}:</strong> ${data.message}
      `;
      
      chatMessages.appendChild(messageElement);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });
});