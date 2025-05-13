"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChatHandlers = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const setupChatHandlers = (io, socket) => {
    const userId = socket.handshake.auth.user_id;
    if (!userId) {
        console.warn("Chat socket missing user_id in auth");
        return;
    }
    console.log(`Setting up chat handlers for user ${userId}`);
    socket.join('global');
    console.log(`User ${userId} joined global chat room`);
    socket.on("chat_message", async (data) => {
        console.log(`Chat message from user ${userId}:`, data);
        try {
            const { message, game_id } = data;
            if (!message) {
                console.error("Message is empty");
                return;
            }
            const roomId = game_id === 'global' ? 'global' : `game:${game_id}`;
            const user = await connection_1.default.oneOrNone("SELECT username FROM users WHERE id = $1", [userId]);
            if (!user) {
                console.error("User not found:", userId);
                return;
            }
            try {
                const result = await connection_1.default.one(`INSERT INTO chat_messages(sender_id, game_id, message) 
           VALUES($1, $2, $3) 
           RETURNING id, created_at`, [userId, game_id === 'global' ? null : game_id, message]);
                console.log(`Message stored with ID ${result.id}`);
                io.to(roomId).emit("chat_message", {
                    id: result.id,
                    user_id: userId,
                    username: user.username,
                    message: message,
                    timestamp: result.created_at
                });
            }
            catch (dbError) {
                console.error("Error storing message:", dbError);
                io.to(roomId).emit("chat_message", {
                    id: Date.now(),
                    user_id: userId,
                    username: user.username,
                    message: message,
                    timestamp: new Date()
                });
            }
        }
        catch (error) {
            console.error("Error in chat_message handler:", error);
        }
    });
};
exports.setupChatHandlers = setupChatHandlers;
//# sourceMappingURL=chat.js.map