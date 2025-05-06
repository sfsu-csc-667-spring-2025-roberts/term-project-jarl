document.addEventListener('DOMContentLoaded', function() {
    // Socket setup
    const socket = io();
    
    // DOM Elements
    const gameContainer = document.getElementById('game-container');
    const lobbyContainer = document.getElementById('lobby-container');
    const startGameButton = document.getElementById('start-game-button');
    const leaveGameButton = document.getElementById('leave-game-button');
    const joinGameButtons = document.querySelectorAll('.join-game-button');
    const createGameForm = document.getElementById('create-game-form');
    const gamesList = document.getElementById('games-list');
    const errorMessage = document.getElementById('error-message');
    
    // Game state
    let currentGameId = null;
    let isGameCreator = false;
    let currentUserId = document.body.getAttribute('data-user-id');
    
    // Setup event listeners
    function setupEventListeners() {
      // Start game event
      if (startGameButton) {
        startGameButton.addEventListener('click', function() {
          if (!currentGameId) {
            showError('No game selected');
            return;
          }
          
          fetch(`/games/${currentGameId}/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            if (!response.ok) {
              return response.json().then(data => {
                throw new Error(data.error || 'Failed to start game');
              });
            }
            return response.json();
          })
          .catch(error => {
            console.error('Error starting game:', error);
            showError(error.message || 'Failed to start game');
          });
        });
      }
      
      // Leave game event
      if (leaveGameButton) {
        leaveGameButton.addEventListener('click', function() {
          if (!currentGameId) return;
          
          fetch(`/games/${currentGameId}/leave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          })
          .then(response => {
            if (!response.ok) {
              return response.json().then(data => {
                throw new Error(data.error || 'Failed to leave game');
              });
            }
            return response.json();
          })
          .then(() => {
            // Leave the game room
            socket.emit('leave:game', { gameId: currentGameId });
            currentGameId = null;
            isGameCreator = false;
            
            // Show lobby
            lobbyContainer.style.display = 'block';
            gameContainer.style.display = 'none';
          })
          .catch(error => {
            console.error('Error leaving game:', error);
            showError(error.message || 'Failed to leave game');
          });
        });
      }
      
      // Join game events
      joinGameButtons.forEach(button => {
        button.addEventListener('click', function() {
          const gameId = this.getAttribute('data-game-id');
          if (gameId) {
            joinGame(gameId);
          }
        });
      });
      
      // Create game form
      if (createGameForm) {
        createGameForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          const formData = new FormData(this);
          
          fetch('/games/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: formData.get('name'),
              maxPlayers: formData.get('maxPlayers')
            })
          })
          .then(response => {
            if (!response.ok) {
              return response.json().then(data => {
                throw new Error(data.error || 'Failed to create game');
              });
            }
            return response.json();
          })
          .then(game => {
            currentGameId = game._id;
            isGameCreator = true;
            
            // Join the game room via socket
            socket.emit('join:game', { 
              gameId: game._id,
              userId: currentUserId
            });
            
            // Show game lobby
            showGameLobby(game);
            
            // Reset form
            createGameForm.reset();
          })
          .catch(error => {
            console.error('Error creating game:', error);
            showError(error.message || 'Failed to create game');
          });
        });
      }
    }
    
    // Socket listeners
    function setupSocketListeners() {
      // Join the lobby room
      socket.emit('join:lobby');
      
      // Game created event
      socket.on('game:created', function(game) {
        // Add game to list if not already there
        if (!document.querySelector(`.game-item[data-game-id="${game._id}"]`)) {
          addGameToList(game);
        }
      });
      
      // Player joined event
      socket.on('player:joined', function(data) {
        if (currentGameId === data.gameId) {
          // Refresh game data
          fetchGameData(data.gameId);
        }
      });
      
      // Game started event
      socket.on('game:started', function(data) {
        if (currentGameId === data.gameId) {
          // Show game UI
          showGameUI();
          // Update game data
          updateGameUI(data.game);
        }
      });
      
      // Error event
      socket.on('error', function(data) {
        showError(data.message);
      });
    }
    
    // Helper functions
    function joinGame(gameId) {
      fetch(`/games/${gameId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (!response.ok) {
          return response.json().then(data => {
            throw new Error(data.error || 'Failed to join game');
          });
        }
        return response.json();
      })
      .then(game => {
        currentGameId = game._id;
        isGameCreator = game.createdBy === currentUserId;
        
        // Join the game room via socket
        socket.emit('join:game', { 
          gameId,
          userId: currentUserId
        });
        
        // Show game lobby
        showGameLobby(game);
      })
      .catch(error => {
        console.error('Error joining game:', error);
        showError(error.message || 'Failed to join game');
      });
    }
    
    function showGameLobby(game) {
      if (lobbyContainer && gameContainer) {
        lobbyContainer.style.display = 'none';
        gameContainer.style.display = 'block';
        
        const gameLobby = document.getElementById('game-lobby');
        const gamePlay = document.getElementById('game-play');
        
        if (gameLobby && gamePlay) {
          gameLobby.style.display = 'block';
          gamePlay.style.display = 'none';
        }
        
        // Show/hide start game button based on creator status
        if (startGameButton) {
          startGameButton.style.display = isGameCreator ? 'block' : 'none';
        }
        
        updateGameLobbyUI(game);
      }
    }
    
    function showGameUI() {
      const gameLobby = document.getElementById('game-lobby');
      const gamePlay = document.getElementById('game-play');
      
      if (gameLobby && gamePlay) {
        gameLobby.style.display = 'none';
        gamePlay.style.display = 'block';
      }
    }
    
    function updateGameLobbyUI(game) {
      const gameNameElement = document.getElementById('game-name');
      const playersListElement = document.getElementById('game-players-list');
      
      if (gameNameElement) {
        gameNameElement.textContent = game.name;
      }
      
      if (playersListElement) {
        playersListElement.innerHTML = '';
        
        // Add each player to the list
        game.players.forEach(player => {
          const li = document.createElement('li');
          
          // Handle both populated and unpopulated player objects
          const playerId = player._id || player;
          const playerName = player.username || 'Player ' + playerId;
          
          li.textContent = playerName;
          
          // Mark the creator
          if (playerId.toString() === game.createdBy.toString() || 
              (game.createdBy._id && playerId.toString() === game.createdBy._id.toString())) {
            li.textContent += ' (Host)';
          }
          
          // Mark the current user
          if (playerId.toString() === currentUserId) {
            li.textContent += ' (You)';
          }
          
          playersListElement.appendChild(li);
        });
      }
    }
    
    function updateGameUI(game) {
      // Update community cards
      const communityCardsElement = document.getElementById('community-cards');
      if (communityCardsElement && game.communityCards) {
        communityCardsElement.innerHTML = '';
        
        // Add each community card
        game.communityCards.forEach(card => {
          addCardElement(communityCardsElement, card);
        });
      }
      
      // Update player cards
      const playerCardsElement = document.getElementById('player-cards');
      if (playerCardsElement && game.playerCards) {
        playerCardsElement.innerHTML = '';
        
        // Check if the map has cards for the current user
        const playerCards = game.playerCards.get(currentUserId);
        if (playerCards) {
          playerCards.forEach(card => {
            addCardElement(playerCardsElement, card);
          });
        }
      }
      
      // Update pot amount
      const potAmountElement = document.getElementById('pot-amount');
      if (potAmountElement) {
        potAmountElement.textContent = game.pot || 0;
      }
      
      // Update round info
      const roundInfoElement = document.getElementById('round-info');
      if (roundInfoElement) {
        const roundMap = {
          'waiting': 'Waiting for game to start',
          'pre-flop': 'Pre-flop',
          'flop': 'Flop',
          'turn': 'Turn',
          'river': 'River',
          'showdown': 'Showdown',
          'ended': 'Game ended'
        };
        
        roundInfoElement.textContent = 'Round: ' + (roundMap[game.round] || game.round);
      }
      
      // Update turn indicator
      const turnIndicatorElement = document.getElementById('turn-indicator');
      if (turnIndicatorElement && game.currentTurn) {
        const isMyTurn = game.currentTurn.toString() === currentUserId;
        turnIndicatorElement.textContent = isMyTurn ? 'Your turn!' : 'Waiting for other player';
        
        // Show/hide action buttons
        const actionButtonsElement = document.getElementById('action-buttons');
        if (actionButtonsElement) {
          actionButtonsElement.style.display = isMyTurn ? 'flex' : 'none';
        }
      }
    }
    
    function addCardElement(container, card) {
      const cardElement = document.createElement('div');
      cardElement.classList.add('card');
      cardElement.setAttribute('data-suit', card.suit);
      
      const valueElement = document.createElement('div');
      valueElement.classList.add('card-value');
      valueElement.textContent = card.value;
      
      const suitElement = document.createElement('div');
      suitElement.classList.add('card-suit');
      
      // Use appropriate symbol for suit
      let suitSymbol = '';
      switch (card.suit.toLowerCase()) {
        case 'hearts':
          suitSymbol = '♥';
          break;
        case 'diamonds':
          suitSymbol = '♦';
          break;
        case 'clubs':
          suitSymbol = '♣';
          break;
        case 'spades':
          suitSymbol = '♠';
          break;
        default:
          suitSymbol = card.suit;
      }
      
      suitElement.textContent = suitSymbol;
      
      cardElement.appendChild(valueElement);
      cardElement.appendChild(suitElement);
      container.appendChild(cardElement);
    }
    
    function addGameToList(game) {
      if (!gamesList) return;
      
      const gameItem = document.createElement('div');
      gameItem.classList.add('game-item');
      gameItem.setAttribute('data-game-id', game._id);
      
      gameItem.innerHTML = `
        <h3>${game.name}</h3>
        <p>Players: ${game.players.length}/${game.maxPlayers}</p>
        <button class="join-game-button btn btn-primary" data-game-id="${game._id}">Join</button>
      `;
      
      gamesList.appendChild(gameItem);
      
      // Add event listener to new join button
      const joinButton = gameItem.querySelector('.join-game-button');
      if (joinButton) {
        joinButton.addEventListener('click', function() {
          joinGame(game._id);
        });
      }
    }
    
    function fetchGameData(gameId) {
      fetch(`/games/${gameId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to fetch game data');
          }
          return response.json();
        })
        .then(game => {
          if (game.isStarted) {
            showGameUI();
            updateGameUI(game);
          } else {
            updateGameLobbyUI(game);
          }
        })
        .catch(error => {
          console.error('Error fetching game data:', error);
          showError('Failed to fetch game data');
        });
    }
    
    function showError(message) {
      if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide after 3 seconds
        setTimeout(() => {
          errorMessage.style.display = 'none';
        }, 3000);
      }
    }
    
    // Initialize
    setupEventListeners();
    setupSocketListeners();
  });