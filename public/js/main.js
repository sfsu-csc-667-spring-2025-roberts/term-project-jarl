/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/public/client/appManager.ts":
/*!*****************************************!*\
  !*** ./src/public/client/appManager.ts ***!
  \*****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


// src/public/client/appManager.ts
// Single entry point for all client-side initialization
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
const index_1 = __webpack_require__(/*! ./socket/index */ "./src/public/client/socket/index.ts");
class AppManager {
    constructor() {
        this.initialized = false;
        this.socket = null;
    }
    static getInstance() {
        if (!AppManager.instance) {
            AppManager.instance = new AppManager();
        }
        return AppManager.instance;
    }
    async init() {
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
            this.socket = (0, index_1.initSocket)();
            if (!this.socket) {
                console.error('Failed to initialize socket');
                return;
            }
            // Wait for socket to connect
            await new Promise((resolve) => {
                if (this.socket.connected) {
                    resolve(true);
                }
                else {
                    this.socket.on('connect', () => resolve(true));
                    setTimeout(() => resolve(true), 2000); // Timeout after 2 seconds
                }
            });
            console.log('Socket connected, initializing modules...');
            // Initialize modules based on current page
            const path = window.location.pathname;
            if (path === '/' || path.includes('/lobby')) {
                await this.initLobby();
                this.initFunds(); // Initialize funds functionality on lobby page
            }
            else if (path.includes('/games/')) {
                await this.initGame();
                this.initFunds(); // Initialize funds functionality on game page too
            }
            // Always initialize chat if elements exist
            this.initChat();
        }
        catch (error) {
            console.error('Error initializing app:', error);
        }
    }
    waitForBootstrap() {
        return new Promise((resolve) => {
            if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                resolve();
            }
            else {
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
            }
        });
    }
    async initLobby() {
        console.log('Initializing lobby...');
        try {
            // Use require-style import
            const lobby = await Promise.resolve().then(() => __importStar(__webpack_require__(/*! ./js/lobby */ "./src/public/client/js/lobby.ts")));
            const Lobby = lobby.default;
            // Wait for Bootstrap to be fully loaded before initializing lobby
            await this.waitForBootstrap();
            const lobbyInstance = new Lobby(this.socket);
            lobbyInstance.init();
        }
        catch (error) {
            console.error('Error initializing lobby:', error);
        }
    }
    async initGame() {
        console.log('Initializing game...');
        try {
            // Use require-style import
            const game = await Promise.resolve().then(() => __importStar(__webpack_require__(/*! ./js/games */ "./src/public/client/js/games.ts")));
            const Game = game.default;
            const gameInstance = new Game(this.socket);
            gameInstance.init();
        }
        catch (error) {
            console.error('Error initializing game:', error);
        }
    }
    initFunds() {
        console.log('Initializing funds functionality...');
        // Add funds form
        const addFundsForm = document.getElementById('add-funds-form');
        if (addFundsForm) {
            addFundsForm.addEventListener('submit', async (event) => {
                var _a, _b;
                event.preventDefault();
                const amount = (_a = document.getElementById('amount')) === null || _a === void 0 ? void 0 : _a.value;
                const paymentMethod = (_b = document.getElementById('payment-method')) === null || _b === void 0 ? void 0 : _b.value;
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
                    if (!response.ok) {
                        const errorData = await response.json();
                        console.log('Add funds response not OK:', response.status, JSON.stringify(errorData));
                        throw new Error(`Server returned ${response.status}: ${JSON.stringify(errorData)}`);
                    }
                    const data = await response.json();
                    if (data.success) {
                        // Update balance display
                        this.updateBalanceDisplay(data.balance);
                        // Show success message
                        this.showSuccess(`Successfully added $${parseFloat(amount).toFixed(2)} to your account`);
                        // Hide modal
                        this.closeModal('add-funds-modal');
                        // Reset form
                        addFundsForm.reset();
                    }
                    else {
                        this.showError(data.message || 'Failed to add funds');
                    }
                }
                catch (error) {
                    console.error('Error adding funds:', error);
                    this.showError('Failed to add funds. Please try again later.');
                }
            });
        }
        // Withdraw funds form
        const withdrawFundsForm = document.getElementById('withdraw-funds-form');
        if (withdrawFundsForm) {
            withdrawFundsForm.addEventListener('submit', async (event) => {
                var _a;
                event.preventDefault();
                const amount = (_a = document.getElementById('withdraw-amount')) === null || _a === void 0 ? void 0 : _a.value;
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
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`Server returned ${response.status}: ${JSON.stringify(errorData)}`);
                    }
                    const data = await response.json();
                    if (data.success) {
                        // Update balance display
                        this.updateBalanceDisplay(data.balance);
                        // Show success message
                        this.showSuccess(`Successfully withdrew $${parseFloat(data.amount).toFixed(2)} from your account`);
                        // Hide modal
                        this.closeModal('withdraw-funds-modal');
                        // Reset form
                        withdrawFundsForm.reset();
                    }
                    else {
                        this.showError(data.message || 'Failed to withdraw funds');
                    }
                }
                catch (error) {
                    console.error('Error withdrawing funds:', error);
                    this.showError('Failed to withdraw funds. Please try again later.');
                }
            });
        }
        // Load initial balance
        this.fetchAndDisplayBalance();
    }
    // Fetch and display user's balance
    async fetchAndDisplayBalance() {
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
        }
        catch (error) {
            console.error('Error fetching balance:', error);
        }
    }
    // Update balance display throughout the page
    updateBalanceDisplay(balance) {
        const balanceElements = document.querySelectorAll('.user-balance');
        const formattedBalance = parseFloat(balance.toString()).toFixed(2);
        balanceElements.forEach(element => {
            element.textContent = `$${formattedBalance}`;
        });
    }
    // Show error message
    showError(message) {
        const errorElement = document.getElementById('funds-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            // Hide after 5 seconds
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
        else {
            alert(`Error: ${message}`);
        }
    }
    // Show success message
    showSuccess(message) {
        const successElement = document.getElementById('funds-success');
        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
            // Hide after 5 seconds
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 5000);
        }
        else {
            alert(`Success: ${message}`);
        }
    }
    // Close modal
    closeModal(modalId) {
        const modalElement = document.getElementById(modalId);
        if (modalElement && typeof bootstrap !== 'undefined') {
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) {
                modal.hide();
            }
        }
        else if (modalElement) {
            modalElement.style.display = 'none';
        }
    }
    initChat() {
        var _a;
        console.log('Initializing chat...');
        // Initialize chat if elements exist
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const chatMessages = document.getElementById('chat-messages');
        if (chatForm && chatInput && chatMessages) {
            // Remove existing listeners
            const newChatForm = chatForm.cloneNode(true);
            (_a = chatForm.parentNode) === null || _a === void 0 ? void 0 : _a.replaceChild(newChatForm, chatForm);
            const newChatInput = newChatForm.querySelector('#chat-input');
            newChatForm.onsubmit = (e) => {
                e.preventDefault();
                const message = newChatInput.value.trim();
                if (!message)
                    return;
                this.socket.emit('chat_message', {
                    message: message,
                    game_id: 'global'
                });
                newChatInput.value = '';
            };
            // Only listen once
            this.socket.off('chat_message');
            this.socket.on('chat_message', (data) => {
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
    }
    getSocket() {
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
exports["default"] = AppManager;


/***/ }),

/***/ "./src/public/client/js/games.ts":
/*!***************************************!*\
  !*** ./src/public/client/js/games.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {


// src/public/client/js/games.ts
Object.defineProperty(exports, "__esModule", ({ value: true }));
class Game {
    constructor(socket) {
        this.initialized = false;
        this.socket = socket;
    }
    init() {
        if (this.initialized) {
            console.log('Game already initialized');
            return;
        }
        console.log('Initializing game functionality...');
        this.initialized = true;
        this.initCardInteraction();
        this.initGameControls();
        this.setupSocketListeners();
    }
    initCardInteraction() {
        const playerCards = document.querySelector('.player-cards');
        if (playerCards) {
            playerCards.addEventListener('click', (e) => {
                const target = e.target;
                if (target.classList.contains('card')) {
                    target.classList.toggle('selected');
                }
            });
        }
    }
    initGameControls() {
        this.addControlHandler('check-btn', 'check');
        this.addControlHandler('call-btn', 'call');
        this.addControlHandler('fold-btn', 'fold');
        this.addControlHandler('all-in-btn', 'all_in');
        // Bet/Raise button with amount
        const betBtn = document.getElementById('bet-btn');
        const raiseBtn = document.getElementById('raise-btn');
        if (betBtn || raiseBtn) {
            const betButton = betBtn || raiseBtn;
            const betAmountInput = document.getElementById('bet-amount');
            if (betButton) {
                betButton.onclick = () => {
                    if (betAmountInput) {
                        const amount = parseInt(betAmountInput.value);
                        if (isNaN(amount) || amount <= 0) {
                            alert('Please enter a valid bet amount');
                            return;
                        }
                        const action = betBtn ? 'bet' : 'raise';
                        this.socket.emit('game_action', { action, amount });
                    }
                };
            }
        }
        // Leave game button
        const leaveGameBtn = document.getElementById('leave-game-btn');
        if (leaveGameBtn) {
            leaveGameBtn.onclick = () => {
                if (confirm('Are you sure you want to leave the game?')) {
                    const gameId = window.location.pathname.split('/').pop();
                    this.socket.emit('leave_game', gameId, (response) => {
                        if (response.success) {
                            window.location.href = '/';
                        }
                        else {
                            alert('Error leaving game: ' + (response.error || 'Unknown error'));
                        }
                    });
                }
            };
        }
    }
    addControlHandler(buttonId, action) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.onclick = () => {
                this.socket.emit('game_action', { action });
            };
        }
    }
    setupSocketListeners() {
        // Game update
        this.socket.on('game_update', (data) => {
            console.log('Game update:', data);
            this.updateGameUI(data);
        });
        // Game started
        this.socket.on('game_started', (data) => {
            console.log('Game started:', data);
        });
        // Game ended
        this.socket.on('game_ended', (data) => {
            console.log('Game ended:', data);
        });
        // Player action
        this.socket.on('player_action', (data) => {
            console.log('Player action:', data);
        });
    }
    updateGameUI(gameData) {
        // Update pot
        const potDisplay = document.querySelector('.pot-amount');
        if (potDisplay && gameData.pot) {
            potDisplay.textContent = `$${gameData.pot}`;
        }
        // Update player info
        const players = gameData.players || [];
        players.forEach((player, index) => {
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
                }
                else {
                    playerElement.classList.remove('active-player');
                }
            }
        });
        // Update community cards
        if (gameData.communityCards) {
            const communityCardsContainer = document.querySelector('.community-cards');
            if (communityCardsContainer) {
                communityCardsContainer.innerHTML = '';
                gameData.communityCards.forEach((card) => {
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
}
exports["default"] = Game;


/***/ }),

/***/ "./src/public/client/js/lobby.ts":
/*!***************************************!*\
  !*** ./src/public/client/js/lobby.ts ***!
  \***************************************/
/***/ ((__unused_webpack_module, exports) => {


// src/public/client/js/lobby.ts
Object.defineProperty(exports, "__esModule", ({ value: true }));
class Lobby {
    constructor(socket) {
        this.initialized = false;
        this.processingRequest = false;
        this.modals = {};
        this.socket = socket;
    }
    init() {
        if (this.initialized) {
            console.log('Lobby already initialized');
            return;
        }
        console.log('Initializing lobby functionality...');
        this.initialized = true;
        // Initialize modals first
        this.initializeModals();
        this.setupButtons();
        this.setupForms();
        this.setupSocketListeners();
    }
    initializeModals() {
        try {
            // Initialize Bootstrap modals
            const modalIds = ['create-game-modal', 'add-funds-modal', 'join-game-modal'];
            modalIds.forEach(modalId => {
                const modalElement = document.getElementById(modalId);
                if (modalElement) {
                    console.log(`Initializing modal: ${modalId}`);
                    // Destroy existing modal if any
                    const existingModal = bootstrap.Modal.getInstance(modalElement);
                    if (existingModal) {
                        existingModal.dispose();
                    }
                    // Create new modal
                    this.modals[modalId] = new bootstrap.Modal(modalElement, {
                        backdrop: 'static'
                    });
                    // Add event listeners for form reset when modal is hidden
                    modalElement.addEventListener('hidden.bs.modal', () => {
                        const form = modalElement.querySelector('form');
                        if (form) {
                            form.reset();
                        }
                    });
                }
                else {
                    console.warn(`Modal element not found: ${modalId}`);
                }
            });
        }
        catch (error) {
            console.error('Error initializing modals:', error);
        }
    }
    setupButtons() {
        // Create Game Button
        this.addClickHandler('create-game-btn', (e) => {
            e.preventDefault();
            this.showModal('create-game-modal');
        });
        // Create Game Modal Button
        this.addClickHandler('create-game-modal-btn', (e) => {
            e.preventDefault();
            this.showModal('create-game-modal');
        });
        // Add Funds Button
        this.addClickHandler('add-funds-btn', (e) => {
            e.preventDefault();
            this.showModal('add-funds-modal');
        });
        // Join Game Modal Button
        this.addClickHandler('join-game-modal-btn', (e) => {
            e.preventDefault();
            this.showModal('join-game-modal');
        });
        // Cash Out Button
        this.addClickHandler('cash-out-btn', async (e) => {
            e.preventDefault();
            if (this.processingRequest)
                return;
            this.processingRequest = true;
            try {
                await this.handleCashOut();
            }
            finally {
                this.processingRequest = false;
            }
        });
        // Quick Join Buttons with event delegation
        document.addEventListener('click', async (e) => {
            const target = e.target;
            if (target.classList.contains('join-btn') && !target.hasAttribute('disabled')) {
                e.preventDefault();
                const gameId = target.dataset.id;
                if (!gameId || this.processingRequest)
                    return;
                this.processingRequest = true;
                const originalText = target.textContent;
                try {
                    target.textContent = 'Joining...';
                    target.setAttribute('disabled', 'true');
                    await this.joinGame(parseInt(gameId));
                }
                catch (error) {
                    console.error('Error joining game:', error);
                    alert('Error joining game. Please try again.');
                    target.textContent = originalText;
                    target.removeAttribute('disabled');
                }
                finally {
                    this.processingRequest = false;
                }
            }
        });
    }
    setupForms() {
        // Create Game Form
        this.setupForm('create-game-form', async (formData) => {
            if (this.processingRequest)
                return;
            this.processingRequest = true;
            try {
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
                // Log data being sent
                console.log('Creating game with data:', data);
                const response = await fetch('/games/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                // Check if response is OK
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Create game response not OK:', response.status, errorText);
                    throw new Error(`Server returned ${response.status}: ${errorText}`);
                }
                // Parse JSON response
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('Non-JSON response:', text);
                    throw new Error('Invalid response format');
                }
                const result = await response.json();
                console.log('Create game response:', result);
                if (result.success) {
                    this.hideModal('create-game-modal');
                    // Navigate immediately
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
            finally {
                this.processingRequest = false;
            }
        });
        // Add Funds Form
        this.setupForm('add-funds-form', async (formData) => {
            if (this.processingRequest)
                return;
            this.processingRequest = true;
            try {
                const amount = parseFloat(formData.get('amount'));
                const paymentMethod = formData.get('payment-method');
                if (isNaN(amount) || amount < 10) {
                    alert('Please enter a valid amount (minimum $10)');
                    return;
                }
                console.log('Adding funds:', { amount, paymentMethod });
                const response = await fetch('/funds/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: amount,
                        payment_method: paymentMethod
                    })
                });
                // Check response
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Add funds response not OK:', response.status, errorText);
                    throw new Error(`Server returned ${response.status}: ${errorText}`);
                }
                const result = await response.json();
                console.log('Add funds response:', result);
                if (result.success) {
                    this.hideModal('add-funds-modal');
                    alert(`Funds added successfully! New balance: $${result.balance}`);
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
            finally {
                this.processingRequest = false;
            }
        });
        // Join Game Form
        this.setupForm('join-game-form', async (formData) => {
            if (this.processingRequest)
                return;
            this.processingRequest = true;
            try {
                const gameId = formData.get('game-id');
                if (!gameId || isNaN(parseInt(gameId))) {
                    alert('Please enter a valid game ID');
                    return;
                }
                this.hideModal('join-game-modal');
                await this.joinGame(parseInt(gameId));
            }
            catch (error) {
                console.error('Error joining game:', error);
                alert('Error joining game. Please try again.');
            }
            finally {
                this.processingRequest = false;
            }
        });
    }
    setupSocketListeners() {
        if (!this.socket) {
            console.error('Socket not initialized');
            return;
        }
        // Listen for game updates
        this.socket.on('game_update', (data) => {
            console.log('Game update received:', data);
            this.refreshGamesList();
        });
        // Listen for errors
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    }
    refreshGamesList() {
        // Reload the page to refresh the games list
        window.location.reload();
    }
    joinGame(gameId) {
        return new Promise((resolve, reject) => {
            if (!this.socket || !this.socket.connected) {
                reject(new Error('Socket not connected'));
                return;
            }
            console.log('Joining game:', gameId);
            // Set a timeout for the socket response
            const timeout = setTimeout(() => {
                reject(new Error('Join game timeout'));
            }, 5000);
            this.socket.emit('join_game', gameId, (response) => {
                clearTimeout(timeout);
                console.log('Join game response:', response);
                if (response === null || response === void 0 ? void 0 : response.success) {
                    window.location.href = `/games/${gameId}`;
                    resolve();
                }
                else {
                    alert((response === null || response === void 0 ? void 0 : response.error) || 'Failed to join game');
                    reject(new Error((response === null || response === void 0 ? void 0 : response.error) || 'Failed to join game'));
                }
            });
        });
    }
    async handleCashOut() {
        if (!confirm('Are you sure you want to cash out all your funds?')) {
            return;
        }
        try {
            const response = await fetch('/funds/withdraw', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Cash out response not OK:', response.status, errorText);
                throw new Error(`Server returned ${response.status}: ${errorText}`);
            }
            const result = await response.json();
            console.log('Cash out response:', result);
            if (result.success) {
                alert(`Cash out successful! Amount: $${result.amount}`);
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
    }
    addClickHandler(elementId, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            // Remove existing event listeners
            const newElement = element.cloneNode(true);
            if (element.parentNode) {
                element.parentNode.replaceChild(newElement, element);
            }
            // Add single event listener
            const newRef = document.getElementById(elementId);
            if (newRef) {
                newRef.addEventListener('click', handler, { once: false });
            }
        }
    }
    setupForm(formId, handler) {
        const form = document.getElementById(formId);
        if (form) {
            // Remove existing event listeners
            const newForm = form.cloneNode(true);
            if (form.parentNode) {
                form.parentNode.replaceChild(newForm, form);
            }
            // Add single event listener
            const newFormRef = document.getElementById(formId);
            if (newFormRef) {
                newFormRef.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const formData = new FormData(newFormRef);
                    await handler(formData);
                });
            }
        }
    }
    showModal(modalId) {
        console.log('Showing modal:', modalId);
        if (this.modals[modalId]) {
            try {
                this.modals[modalId].show();
            }
            catch (error) {
                console.error(`Error showing modal ${modalId}:`, error);
                alert('Error showing modal. Please try again.');
            }
        }
        else {
            console.warn(`Modal ${modalId} not initialized`);
            // Try to initialize it on-demand
            const modalElement = document.getElementById(modalId);
            if (modalElement && typeof bootstrap !== 'undefined') {
                this.modals[modalId] = new bootstrap.Modal(modalElement);
                this.modals[modalId].show();
            }
            else {
                console.error(`Modal ${modalId} element not found or Bootstrap not loaded`);
            }
        }
    }
    hideModal(modalId) {
        console.log('Hiding modal:', modalId);
        if (this.modals[modalId]) {
            try {
                this.modals[modalId].hide();
            }
            catch (error) {
                console.error(`Error hiding modal ${modalId}:`, error);
            }
        }
        else {
            console.warn(`Modal ${modalId} not initialized`);
        }
    }
}
exports["default"] = Lobby;


/***/ }),

/***/ "./src/public/client/socket/index.ts":
/*!*******************************************!*\
  !*** ./src/public/client/socket/index.ts ***!
  \*******************************************/
/***/ ((__unused_webpack_module, exports) => {


// src/public/client/socket/index.ts
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.disconnectSocket = exports.getSocket = exports.initSocket = void 0;
let socket = null;
const initSocket = () => {
    // If socket already exists and is connected, return it
    if (socket && socket.connected) {
        console.log('Socket already connected');
        return socket;
    }
    // Get user ID from the body data attribute
    const userDataElement = document.querySelector('body');
    if (!userDataElement || !userDataElement.dataset.userId) {
        console.error('User ID not found in body dataset');
        return null;
    }
    const userId = userDataElement.dataset.userId;
    if (!userId || userId === '0' || userId === '') {
        console.error('Invalid user ID for socket connection');
        return null;
    }
    console.log(`Creating socket for user ${userId}`);
    // Make sure Socket.IO is loaded
    if (!window.io) {
        console.error('Socket.io not loaded');
        return null;
    }
    // Create new socket connection
    socket = window.io({
        auth: {
            user_id: parseInt(userId)
        },
        reconnection: false,
        transports: ['websocket'],
        timeout: 10000
    });
    // Socket connection event handlers
    socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
    });
    socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
    });
    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
    });
    socket.on('auth_error', (message) => {
        console.error('Socket authentication error:', message);
        window.location.href = '/signin';
    });
    socket.on('duplicate_connection', (message) => {
        console.log('Duplicate connection detected');
    });
    return socket;
};
exports.initSocket = initSocket;
const getSocket = () => {
    if (!socket) {
        return (0, exports.initSocket)();
    }
    return socket;
};
exports.getSocket = getSocket;
const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
exports.disconnectSocket = disconnectSocket;
// Clean up on page unload
window.addEventListener('beforeunload', () => {
    (0, exports.disconnectSocket)();
});
exports["default"] = {
    initSocket: exports.initSocket,
    getSocket: exports.getSocket,
    disconnectSocket: exports.disconnectSocket
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/public/client/appManager.ts");
/******/ 	
/******/ })()
;
//# sourceMappingURL=main.js.map