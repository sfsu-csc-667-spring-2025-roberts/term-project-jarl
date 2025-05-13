"use strict";
// src/public/client/socket/index.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.socket = exports.getSocket = exports.initializeSocket = void 0;
const socket_io_client_1 = require("socket.io-client");
// Store the socket instance
let socket = null;
exports.socket = socket;
// Initialize the socket
const initializeSocket = (userId) => {
    if (socket)
        return socket;
    console.log(`Initializing socket for user ${userId}`);
    exports.socket = socket = (0, socket_io_client_1.io)({
        auth: {
            user_id: userId
        }
    });
    // Set up basic event handlers
    socket.on("connect", () => {
        console.log("Socket connected:", socket === null || socket === void 0 ? void 0 : socket.id);
    });
    socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
    });
    socket.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
    });
    return socket;
};
exports.initializeSocket = initializeSocket;
// Get the socket instance
const getSocket = () => {
    return socket;
};
exports.getSocket = getSocket;
