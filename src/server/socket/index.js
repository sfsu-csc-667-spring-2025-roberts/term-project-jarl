"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSockets = void 0;
const chat_1 = require("./chat");
const games_1 = require("./games");
const setupSockets = (io) => {
    console.log("Setting up socket.io handlers");
    // Set up connection handler
    io.on("connection", (socket) => {
        var _a, _b;
        console.log("New client connected:", socket.id);
        // Get user ID from auth data
        const userId = socket.handshake.auth.user_id;
        console.log("Socket handshake auth:", socket.handshake.auth);
        console.log("Socket handshake query:", socket.handshake.query);
        if (!userId) {
            console.warn("No user ID provided in auth");
            // Try to get user ID from session if it exists
            const session = (_a = socket.request) === null || _a === void 0 ? void 0 : _a.session;
            const sessionUserId = (session === null || session === void 0 ? void 0 : session.userId) || ((_b = session === null || session === void 0 ? void 0 : session.user) === null || _b === void 0 ? void 0 : _b.id);
            if (sessionUserId) {
                console.log(`Using user ID from session: ${sessionUserId}`);
                // Attach to handshake.auth for other handlers
                socket.handshake.auth.user_id = sessionUserId;
            }
            else {
                console.warn("No user ID in auth or session");
            }
        }
        else {
            console.log(`User connected with ID: ${userId}`);
        }
        // If we have a user ID, join their user room
        if (userId) {
            socket.join(`user:${userId}`);
        }
        // Set up module handlers
        (0, chat_1.setupChatHandlers)(io, socket);
        (0, games_1.setupGamesHandlers)(io, socket);
        // Handle disconnection
        socket.on("disconnect", (reason) => {
            console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
        });
    });
    return io;
};
exports.setupSockets = setupSockets;
