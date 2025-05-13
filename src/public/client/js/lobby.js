"use strict";
// src/public/client/js/lobby.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
// Initialize socket when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    // Get user ID from the body data attribute
    const userId = document.body.dataset.userId || '0';
    // Initialize socket connection
    const socket = (0, socket_io_client_1.io)({
        auth: {
            user_id: parseInt(userId)
        }
    });
    // Socket connection event handlers
    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });
    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });
    // Initialize Bootstrap modals
    const createGameModal = new window.bootstrap.Modal(document.getElementById('create-game-modal'));
    const addFundsModal = new window.bootstrap.Modal(document.getElementById('add-funds-modal'));
    const joinGameModal = new window.bootstrap.Modal(document.getElementById('join-game-modal'));
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
    const createGameForm = document.getElementById('create-game-form');
    if (createGameForm) {
        createGameForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = {
                name: formData.get('game-name'),
                maxPlayers: parseInt(formData.get('max-players'))
            };
            try {
                const response = yield fetch('/games/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                const result = yield response.json();
                if (result.success) {
                    // Redirect to the game page
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
        }));
    }
    // Add Funds Form Handler
    const addFundsForm = document.getElementById('add-funds-form');
    if (addFundsForm) {
        addFundsForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const formData = new FormData(e.target);
            const amount = parseFloat(formData.get('amount'));
            const paymentMethod = formData.get('payment-method');
            try {
                const response = yield fetch('/funds/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount: amount,
                        payment_method: paymentMethod
                    })
                });
                const result = yield response.json();
                if (result.success) {
                    alert('Funds added successfully!');
                    addFundsModal.hide();
                    // Reload the page to show updated balance
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
        }));
    }
    // Join Game Form Handler
    const joinGameForm = document.getElementById('join-game-form');
    if (joinGameForm) {
        joinGameForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            const formData = new FormData(e.target);
            const gameId = formData.get('game-id');
            try {
                // Navigate to the game page
                window.location.href = `/games/${gameId}`;
            }
            catch (error) {
                console.error('Error joining game:', error);
                alert('Error joining game. Please try again.');
            }
        }));
    }
    // Quick join game buttons in the games list
    document.querySelectorAll('.join-btn').forEach(button => {
        button.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            const target = e.target;
            const gameId = target.dataset.id;
            if (!gameId)
                return;
            // Send join_game event via socket
            socket.emit('join_game', gameId, (response) => {
                if (response.success) {
                    // Navigate to the game page
                    window.location.href = `/games/${gameId}`;
                }
                else {
                    alert(response.error || 'Failed to join game');
                }
            });
        }));
    });
    // Cash Out Button Handler
    const cashOutBtn = document.getElementById('cash-out-btn');
    if (cashOutBtn) {
        cashOutBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch('/funds/withdraw', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });
                const result = yield response.json();
                if (result.success) {
                    alert('Cash out successful!');
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
        }));
    }
    // Chat functionality
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    if (chatForm && chatInput && chatMessages) {
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message)
                return;
            // Send chat message
            socket.emit('chat_message', {
                message: message,
                game_id: 'global'
            });
            // Clear input
            chatInput.value = '';
        });
        // Listen for chat messages
        socket.on('chat_message', (data) => {
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
    socket.on('player_joined', (data) => {
        console.log('Player joined:', data);
        // Refresh game list or update UI
    });
    socket.on('player_left', (data) => {
        console.log('Player left:', data);
        // Refresh game list or update UI
    });
    // Chat tab switching
    document.querySelectorAll('[data-chat]').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target;
            // Update active tab
            document.querySelectorAll('[data-chat]').forEach(t => t.classList.remove('active'));
            target.classList.add('active');
            // Update chat room
            const chatType = target.dataset.chat;
            if (chatType === 'global') {
                // Show global chat
                chatMessages.style.display = 'block';
                chatForm.style.display = 'flex';
            }
            else {
                // Show friends list or private messages
                // TODO: Implement private messaging
            }
        });
    });
});
