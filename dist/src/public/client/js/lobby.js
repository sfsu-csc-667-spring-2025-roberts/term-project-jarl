"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../socket/index");
let isInitialized = false;
document.addEventListener('DOMContentLoaded', function () {
    if (isInitialized) {
        console.log('Lobby already initialized');
        return;
    }
    console.log('Lobby script loaded');
    isInitialized = true;
    let gameSocket;
    try {
        gameSocket = (0, index_1.getSocket)();
    }
    catch (error) {
        console.error('Cannot get socket:', error);
        alert('Please log in to access the poker game.');
        window.location.href = '/signin';
        return;
    }
    if (!gameSocket.connected) {
        const connectListener = () => {
            gameSocket.off('connect', connectListener);
            initLobbyFunctionality();
        };
        gameSocket.on('connect', connectListener);
    }
    else {
        initLobbyFunctionality();
    }
    function initLobbyFunctionality() {
        console.log('Initializing lobby functionality');
        let createGameModal;
        let addFundsModal;
        let joinGameModal;
        try {
            createGameModal = new window.bootstrap.Modal(document.getElementById('create-game-modal'));
            addFundsModal = new window.bootstrap.Modal(document.getElementById('add-funds-modal'));
            joinGameModal = new window.bootstrap.Modal(document.getElementById('join-game-modal'));
        }
        catch (error) {
            console.error('Error initializing modals:', error);
        }
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
        const createGameForm = document.getElementById('create-game-form');
        if (createGameForm) {
            createGameForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const data = {
                    name: formData.get('game-name'),
                    maxPlayers: parseInt(formData.get('max-players')),
                    minBuyIn: formData.get('min-buy-in') ? parseInt(formData.get('min-buy-in')) : undefined,
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
                    }
                    else {
                        alert(result.message || 'Failed to create game');
                    }
                }
                catch (error) {
                    console.error('Error creating game:', error);
                    alert('Error creating game. Please try again.');
                }
            });
        }
        const addFundsForm = document.getElementById('add-funds-form');
        if (addFundsForm) {
            addFundsForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const amount = parseFloat(formData.get('amount'));
                const paymentMethod = formData.get('payment-method');
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
                    }
                    else {
                        alert(result.message || 'Failed to add funds');
                    }
                }
                catch (error) {
                    console.error('Error adding funds:', error);
                    alert('Error processing payment. Please try again.');
                }
            });
        }
        const joinGameForm = document.getElementById('join-game-form');
        if (joinGameForm) {
            joinGameForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const gameId = formData.get('game-id');
                if (!gameId || isNaN(parseInt(gameId))) {
                    alert('Please enter a valid game ID');
                    return;
                }
                gameSocket.emit('join_game', parseInt(gameId), (response) => {
                    if (response && response.success) {
                        joinGameModal.hide();
                        window.location.href = `/games/${gameId}`;
                    }
                    else {
                        alert((response === null || response === void 0 ? void 0 : response.error) || 'Failed to join game');
                    }
                });
            });
        }
        document.querySelectorAll('.join-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const target = e.target;
                const gameId = target.dataset.id;
                if (!gameId) {
                    console.error('No game ID found');
                    return;
                }
                if (target.hasAttribute('disabled')) {
                    return;
                }
                const originalText = target.textContent;
                target.textContent = 'Joining...';
                target.setAttribute('disabled', 'true');
                gameSocket.emit('join_game', parseInt(gameId), (response) => {
                    target.textContent = originalText;
                    target.removeAttribute('disabled');
                    if (response && response.success) {
                        window.location.href = `/games/${gameId}`;
                    }
                    else {
                        alert((response === null || response === void 0 ? void 0 : response.error) || 'Failed to join game');
                    }
                });
            });
        });
        document.querySelectorAll('.detail-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const target = e.target;
                const gameId = target.dataset.id;
                if (!gameId) {
                    return;
                }
                gameSocket.emit('get_game_info', parseInt(gameId), (response) => {
                    if (response && response.success && response.game) {
                        const game = response.game;
                        const playerList = game.players
                            .filter((p) => p.username)
                            .map((p) => p.username)
                            .join(', ');
                        alert(`Game Details:\n` +
                            `Name: ${game.name}\n` +
                            `State: ${game.state}\n` +
                            `Players: ${game.current_players}/${game.max_players}\n` +
                            `Created by: ${game.creator_name}\n` +
                            `Players in game: ${playerList || 'None'}`);
                    }
                    else {
                        alert('Error getting game details');
                    }
                });
            });
        });
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
                    }
                    else {
                        alert(result.message || 'Cash out failed');
                    }
                }
                catch (error) {
                    console.error('Error during cash out:', error);
                    alert('Error processing cash out. Please try again.');
                }
            });
        }
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        if (chatForm && chatInput && chatMessages) {
            chatForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const message = chatInput.value.trim();
                if (!message)
                    return;
                gameSocket.emit('chat_message', {
                    message: message,
                    game_id: 'global'
                });
                chatInput.value = '';
            });
            gameSocket.on('chat_message', (data) => {
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
                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
        }
        gameSocket.on('player_joined', (data) => {
            console.log('Player joined:', data);
            updateGamesList();
        });
        gameSocket.on('player_left', (data) => {
            console.log('Player left:', data);
            updateGamesList();
        });
        let updateTimeout;
        function updateGamesList() {
            if (updateTimeout) {
                window.clearTimeout(updateTimeout);
            }
            updateTimeout = window.setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
        document.querySelectorAll('[data-chat]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target;
                document.querySelectorAll('[data-chat]').forEach(t => t.classList.remove('active'));
                target.classList.add('active');
                const chatType = target.dataset.chat;
                if (chatType === 'global') {
                    if (chatMessages)
                        chatMessages.style.display = 'block';
                    if (chatForm)
                        chatForm.style.display = 'flex';
                }
            });
        });
    }
});
//# sourceMappingURL=lobby.js.map