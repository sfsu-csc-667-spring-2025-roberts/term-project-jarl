"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSockets = void 0;
const chat_1 = require("./chat");
const games_1 = require("./games");
const setupSockets = (io) => {
    console.log("Setting up socket.io handlers");
    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);
        let userId = socket.handshake.auth.user_id;
        if (typeof userId === 'string') {
            userId = parseInt(userId);
        }
        if (!userId || userId === 0 || isNaN(userId)) {
            console.warn("Invalid or missing user ID in auth");
            socket.emit('auth_error', 'Invalid user authentication');
            socket.disconnect(true);
            return;
        }
        console.log(`User connected with ID: ${userId}`);
        const userRoom = `user:${userId}`;
        const existingSockets = io.sockets.adapter.rooms.get(userRoom);
        if (existingSockets) {
            console.log(`Found ${existingSockets.size} existing connection(s) for user ${userId}`);
            for (const socketId of existingSockets) {
                if (socketId !== socket.id) {
                    const existingSocket = io.sockets.sockets.get(socketId);
                    if (existingSocket) {
                        console.log(`Disconnecting existing socket ${socketId}`);
                        existingSocket.emit('duplicate_connection', 'Another connection established');
                        existingSocket.disconnect(true);
                    }
                }
            }
        }
        socket.join(userRoom);
        console.log(`User ${userId} joined room: ${userRoom}`);
        try {
            (0, chat_1.setupChatHandlers)(io, socket);
            (0, games_1.setupGamesHandlers)(io, socket);
            socket.emit('connected', {
                socketId: socket.id,
                userId: userId
            });
        }
        catch (error) {
            console.error("Error setting up socket handlers:", error);
            socket.disconnect(true);
        }
        socket.on("disconnect", (reason) => {
            console.log(`Client disconnected: ${socket.id}, reason: ${reason}, user: ${userId}`);
        });
    });
    return io;
};
exports.setupSockets = setupSockets;
//# sourceMappingURL=index.js.map