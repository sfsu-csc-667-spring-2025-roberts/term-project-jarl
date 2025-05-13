"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
document.addEventListener('DOMContentLoaded', function () {
    const userId = window.utils.getUserId();
    const gameId = window.location.pathname.split('/').pop() || '';
    const socket = (0, socket_io_client_1.io)({
        auth: {
            user_id: userId
        }
    });
    socket.on('connect', () => {
        console.log('Connected to game socket');
        socket.emit('join_game', gameId, (response) => {
            if (response.success) {
                console.log('Successfully joined game');
            }
            else {
                console.error('Failed to join game:', response.error);
                window.utils.showNotification(response.error || 'Failed to join game', 'danger');
            }
        });
    });
    socket.on('player_joined', (data) => {
        console.log('Player joined:', data);
        updatePlayerList();
    });
    socket.on('player_left', (data) => {
        console.log('Player left:', data);
        updatePlayerList();
    });
    socket.on('game_started', (data) => {
        console.log('Game started:', data);
        window.utils.showNotification('Game has started!', 'success');
        updateGameState(data);
    });
    socket.on('cards_dealt', (data) => {
        console.log('Cards dealt:', data);
        displayPlayerCards(data.cards);
    });
    socket.on('player_action', (data) => {
        console.log('Player action:', data);
        updateGameLog(data);
    });
    function updatePlayerList() {
        console.log('Updating player list...');
    }
    function updateGameState(gameState) {
        console.log('Updating game state:', gameState);
    }
    function displayPlayerCards(cards) {
        const cardsContainer = document.getElementById('player-cards');
        if (cardsContainer) {
            cardsContainer.innerHTML = '';
            cards.forEach(card => {
                const cardElement = createCardElement(card);
                cardsContainer.appendChild(cardElement);
            });
        }
    }
    function createCardElement(card) {
        const div = document.createElement('div');
        div.className = 'card playing-card';
        div.innerHTML = `
      <div class="card-body text-center">
        <h5 class="card-title">${card.rank}</h5>
        <p class="card-text">${card.suit}</p>
      </div>
    `;
        return div;
    }
    function updateGameLog(action) {
        const gameLog = document.getElementById('game-log');
        if (gameLog) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.textContent = `${action.player}: ${action.action}`;
            gameLog.appendChild(logEntry);
            gameLog.scrollTop = gameLog.scrollHeight;
        }
    }
    const actionButtons = {
        fold: document.getElementById('fold-btn'),
        check: document.getElementById('check-btn'),
        call: document.getElementById('call-btn'),
        raise: document.getElementById('raise-btn'),
        allIn: document.getElementById('all-in-btn')
    };
    if (actionButtons.fold) {
        actionButtons.fold.addEventListener('click', () => {
            socket.emit('player_action', {
                game_id: gameId,
                action: 'fold'
            });
        });
    }
    if (actionButtons.check) {
        actionButtons.check.addEventListener('click', () => {
            socket.emit('player_action', {
                game_id: gameId,
                action: 'check'
            });
        });
    }
    if (actionButtons.call) {
        actionButtons.call.addEventListener('click', () => {
            socket.emit('player_action', {
                game_id: gameId,
                action: 'call'
            });
        });
    }
    if (actionButtons.raise) {
        actionButtons.raise.addEventListener('click', () => {
            const raiseAmount = prompt('Enter raise amount:');
            if (raiseAmount && !isNaN(parseFloat(raiseAmount))) {
                socket.emit('player_action', {
                    game_id: gameId,
                    action: 'raise',
                    amount: parseFloat(raiseAmount)
                });
            }
        });
    }
    if (actionButtons.allIn) {
        actionButtons.allIn.addEventListener('click', () => {
            if (confirm('Are you sure you want to go all-in?')) {
                socket.emit('player_action', {
                    game_id: gameId,
                    action: 'all_in'
                });
            }
        });
    }
    const leaveGameBtn = document.getElementById('leave-game-btn');
    if (leaveGameBtn) {
        leaveGameBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to leave the game?')) {
                socket.emit('leave_game', gameId, (response) => {
                    if (response.success) {
                        window.location.href = '/';
                    }
                    else {
                        window.utils.showNotification('Failed to leave game', 'danger');
                    }
                });
            }
        });
    }
    const gameChatForm = document.getElementById('game-chat-form');
    const gameChatInput = document.getElementById('game-chat-input');
    const gameChatMessages = document.getElementById('game-chat-messages');
    if (gameChatForm && gameChatInput) {
        gameChatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = gameChatInput.value.trim();
            if (!message)
                return;
            socket.emit('chat_message', {
                message: message,
                game_id: gameId
            });
            gameChatInput.value = '';
        });
    }
    socket.on('chat_message', (data) => {
        if (gameChatMessages) {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message mb-1';
            messageDiv.innerHTML = `
        <span class="text-muted">${new Date(data.timestamp).toLocaleTimeString()}</span>
        <strong>${data.username}:</strong> ${data.message}
      `;
            gameChatMessages.appendChild(messageDiv);
            gameChatMessages.scrollTop = gameChatMessages.scrollHeight;
        }
    });
});
//# sourceMappingURL=games.js.map