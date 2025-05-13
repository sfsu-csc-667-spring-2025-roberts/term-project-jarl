"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChatHandlers = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const setupChatHandlers = (io, socket) => {
    // Get user ID from auth data
    const userId = socket.handshake.auth.user_id;
    if (!userId) {
        console.warn("Chat socket missing user_id in auth");
        return;
    }
    console.log(`Setting up chat handlers for user ${userId}`);
    // Join the global chat room
    socket.join('global');
    console.log(`User ${userId} joined global chat room`);
    // Listen for chat messages
    socket.on("chat_message", (data) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Chat message from user ${userId}:`, data);
        try {
            const { message, game_id } = data;
            if (!message) {
                console.error("Message is empty");
                return;
            }
            // Determine which room to emit to
            const roomId = game_id === 'global' ? 'global' : `game:${game_id}`;
            // Get user info
            const user = yield connection_1.default.oneOrNone("SELECT username FROM users WHERE id = $1", [userId]);
            if (!user) {
                console.error("User not found:", userId);
                return;
            }
            // Store message in database (if db table exists)
            try {
                const result = yield connection_1.default.one(`INSERT INTO chat_messages(sender_id, game_id, message) 
           VALUES($1, $2, $3) 
           RETURNING id, created_at`, [userId, game_id === 'global' ? null : game_id, message]);
                console.log(`Message stored with ID ${result.id}`);
                // Emit message to room
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
                // If db insert fails, still send the message (but without persistence)
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
    }));
};
exports.setupChatHandlers = setupChatHandlers;
