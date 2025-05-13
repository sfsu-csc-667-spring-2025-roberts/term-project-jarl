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
exports.setupFriendsHandlers = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const setupFriendsHandlers = (io, socket) => {
    // Get user ID from auth data
    const userId = socket.handshake.auth.user_id;
    if (!userId) {
        console.warn("Friends socket missing user_id in auth");
        return;
    }
    // Send friend request
    socket.on("send_friend_request", (targetUserId, callback) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if target user exists
            const targetUser = yield connection_1.default.oneOrNone("SELECT id, username FROM users WHERE id = $1", [targetUserId]);
            if (!targetUser) {
                return callback({ success: false, error: "User not found" });
            }
            // Check if friend request already exists
            const existingRequest = yield connection_1.default.oneOrNone(`SELECT * FROM friend_requests 
         WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`, [userId, targetUserId]);
            if (existingRequest) {
                return callback({ success: false, error: "Friend request already sent or pending" });
            }
            // Check if already friends
            const areFriends = yield connection_1.default.oneOrNone(`SELECT 1 FROM friendships
         WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`, [userId, targetUserId]);
            if (areFriends) {
                return callback({ success: false, error: "Already friends with this user" });
            }
            // Create friend request
            yield connection_1.default.none(`INSERT INTO friend_requests(sender_id, receiver_id, status)
         VALUES($1, $2, 'pending')`, [userId, targetUserId]);
            // Get sender information
            const sender = yield connection_1.default.one("SELECT id, username FROM users WHERE id = $1", [userId]);
            // Notify target user if they're online
            io.to(`user:${targetUserId}`).emit("friend_request", {
                id: sender.id,
                username: sender.username
            });
            callback({ success: true });
        }
        catch (error) {
            console.error("Error sending friend request:", error);
            callback({ success: false, error: "Failed to send friend request" });
        }
    }));
    // Respond to friend request
    socket.on("respond_friend_request", (requestId, accept, callback) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Find the request
            const request = yield connection_1.default.oneOrNone(`SELECT * FROM friend_requests
         WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`, [requestId, userId]);
            if (!request) {
                return callback({ success: false, error: "Friend request not found" });
            }
            if (accept) {
                // Accept the request
                yield connection_1.default.tx((t) => __awaiter(void 0, void 0, void 0, function* () {
                    // Update request status
                    yield t.none(`UPDATE friend_requests
             SET status = 'accepted', updated_at = NOW()
             WHERE id = $1`, [requestId]);
                    // Create friendship
                    yield t.none(`INSERT INTO friendships(user_id_1, user_id_2)
             VALUES($1, $2)`, [request.sender_id, request.receiver_id]);
                }));
                // Get user information
                const [sender, receiver] = yield Promise.all([
                    connection_1.default.one("SELECT id, username FROM users WHERE id = $1", [request.sender_id]),
                    connection_1.default.one("SELECT id, username FROM users WHERE id = $1", [request.receiver_id])
                ]);
                // Notify sender that request was accepted
                io.to(`user:${request.sender_id}`).emit("friend_request_accepted", {
                    id: receiver.id,
                    username: receiver.username
                });
                callback({ success: true });
            }
            else {
                // Decline the request
                yield connection_1.default.none(`UPDATE friend_requests
           SET status = 'declined', updated_at = NOW()
           WHERE id = $1`, [requestId]);
                callback({ success: true });
            }
        }
        catch (error) {
            console.error("Error responding to friend request:", error);
            callback({ success: false, error: "Failed to respond to friend request" });
        }
    }));
    // Remove friend
    socket.on("remove_friend", (friendId, callback) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Check if friendship exists
            const friendship = yield connection_1.default.oneOrNone(`SELECT * FROM friendships
         WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`, [userId, friendId]);
            if (!friendship) {
                return callback({ success: false, error: "Friendship not found" });
            }
            // Remove friendship
            yield connection_1.default.none(`DELETE FROM friendships
         WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`, [userId, friendId]);
            // Notify the other user if they're online
            io.to(`user:${friendId}`).emit("friend_removed", {
                user_id: userId
            });
            callback({ success: true });
        }
        catch (error) {
            console.error("Error removing friend:", error);
            callback({ success: false, error: "Failed to remove friend" });
        }
    }));
    // Get friend status updates
    socket.on("get_friend_statuses", (callback) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // Get all friends with their statuses
            const friends = yield connection_1.default.any(`SELECT u.id, u.username, 
                (SELECT COUNT(*) > 0 FROM active_sessions WHERE user_id = u.id) AS is_online,
                (SELECT g.id FROM game_players gp
                 JOIN games g ON gp.game_id = g.id
                 WHERE gp.user_id = u.id AND g.state = 'active'
                 LIMIT 1) AS current_game_id,
                (SELECT g.name FROM game_players gp
                 JOIN games g ON gp.game_id = g.id
                 WHERE gp.user_id = u.id AND g.state = 'active'
                 LIMIT 1) AS current_game_name
         FROM users u
         JOIN friendships f ON (f.user_id_1 = $1 AND f.user_id_2 = u.id) OR (f.user_id_2 = $1 AND f.user_id_1 = u.id)
         ORDER BY is_online DESC, u.username`, [userId]);
            callback({ success: true, friends });
        }
        catch (error) {
            console.error("Error getting friend statuses:", error);
            callback({ success: false, error: "Failed to get friend statuses" });
        }
    }));
};
exports.setupFriendsHandlers = setupFriendsHandlers;
