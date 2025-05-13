"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocket = exports.initSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
let socket = null;
let isInitializing = false;
const initSocket = () => {
    if (isInitializing) {
        console.log('Socket initialization already in progress');
        return socket;
    }
    if (socket && socket.connected) {
        console.log('Socket already connected');
        return socket;
    }
    isInitializing = true;
    try {
        const userId = document.body.dataset.userId;
        if (!userId || userId === '0' || userId === '') {
            console.error('Invalid user ID for socket connection');
            throw new Error('User must be logged in to connect to socket');
        }
        console.log(`Initializing socket for user ${userId}`);
        if (socket) {
            socket.disconnect();
            socket = null;
        }
        socket = (0, socket_io_client_1.io)({
            auth: {
                user_id: parseInt(userId)
            },
            reconnection: true,
            reconnectionAttempts: 3,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 3000,
            timeout: 5000,
            transports: ['websocket']
        });
        socket.on('connect', () => {
            console.log('Socket connected:', socket.id);
            isInitializing = false;
        });
        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            isInitializing = false;
        });
        socket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
        });
        socket.on('reconnect', (attemptNumber) => {
            console.log(`Successfully reconnected after ${attemptNumber} attempts`);
        });
        socket.on('reconnect_failed', () => {
            console.error('Failed to reconnect');
            isInitializing = false;
        });
        socket.on('auth_error', (message) => {
            console.error('Socket authentication error:', message);
            window.location.href = '/signin';
        });
        socket.on('duplicate_connection', (message) => {
            console.warn('Duplicate connection detected:', message);
        });
        window.gameSocket = socket;
        return socket;
    }
    catch (error) {
        isInitializing = false;
        throw error;
    }
};
exports.initSocket = initSocket;
const getSocket = () => {
    if (!socket || !socket.connected) {
        return (0, exports.initSocket)();
    }
    return socket;
};
exports.getSocket = getSocket;
if (!window.gameSocket) {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            (0, exports.initSocket)();
        }
        catch (error) {
            console.error('Failed to initialize socket:', error);
            setTimeout(() => {
                window.location.href = '/signin';
            }, 2000);
        }
    });
}
exports.default = socket;
//# sourceMappingURL=index.js.map