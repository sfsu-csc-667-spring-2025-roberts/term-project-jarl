"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupFriendsHandlers = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const setupFriendsHandlers = (io, socket) => {
    const userId = socket.handshake.auth.user_id;
    if (!userId) {
        console.warn("Friends socket missing user_id in auth");
        return;
    }
    socket.on("send_friend_request", async (targetUserId, callback) => {
        try {
            const targetUser = await connection_1.default.oneOrNone("SELECT id, username FROM users WHERE id = $1", [targetUserId]);
            if (!targetUser) {
                return callback({ success: false, error: "User not found" });
            }
            const existingRequest = await connection_1.default.oneOrNone(`SELECT * FROM friend_requests 
         WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)`, [userId, targetUserId]);
            if (existingRequest) {
                return callback({ success: false, error: "Friend request already sent or pending" });
            }
            const areFriends = await connection_1.default.oneOrNone(`SELECT 1 FROM friendships
         WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`, [userId, targetUserId]);
            if (areFriends) {
                return callback({ success: false, error: "Already friends with this user" });
            }
            await connection_1.default.none(`INSERT INTO friend_requests(sender_id, receiver_id, status)
         VALUES($1, $2, 'pending')`, [userId, targetUserId]);
            const sender = await connection_1.default.one("SELECT id, username FROM users WHERE id = $1", [userId]);
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
    });
    socket.on("respond_friend_request", async (requestId, accept, callback) => {
        try {
            const request = await connection_1.default.oneOrNone(`SELECT * FROM friend_requests
         WHERE id = $1 AND receiver_id = $2 AND status = 'pending'`, [requestId, userId]);
            if (!request) {
                return callback({ success: false, error: "Friend request not found" });
            }
            if (accept) {
                await connection_1.default.tx(async (t) => {
                    await t.none(`UPDATE friend_requests
             SET status = 'accepted', updated_at = NOW()
             WHERE id = $1`, [requestId]);
                    await t.none(`INSERT INTO friendships(user_id_1, user_id_2)
             VALUES($1, $2)`, [request.sender_id, request.receiver_id]);
                });
                const [sender, receiver] = await Promise.all([
                    connection_1.default.one("SELECT id, username FROM users WHERE id = $1", [request.sender_id]),
                    connection_1.default.one("SELECT id, username FROM users WHERE id = $1", [request.receiver_id])
                ]);
                io.to(`user:${request.sender_id}`).emit("friend_request_accepted", {
                    id: receiver.id,
                    username: receiver.username
                });
                callback({ success: true });
            }
            else {
                await connection_1.default.none(`UPDATE friend_requests
           SET status = 'declined', updated_at = NOW()
           WHERE id = $1`, [requestId]);
                callback({ success: true });
            }
        }
        catch (error) {
            console.error("Error responding to friend request:", error);
            callback({ success: false, error: "Failed to respond to friend request" });
        }
    });
    socket.on("remove_friend", async (friendId, callback) => {
        try {
            const friendship = await connection_1.default.oneOrNone(`SELECT * FROM friendships
         WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`, [userId, friendId]);
            if (!friendship) {
                return callback({ success: false, error: "Friendship not found" });
            }
            await connection_1.default.none(`DELETE FROM friendships
         WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)`, [userId, friendId]);
            io.to(`user:${friendId}`).emit("friend_removed", {
                user_id: userId
            });
            callback({ success: true });
        }
        catch (error) {
            console.error("Error removing friend:", error);
            callback({ success: false, error: "Failed to remove friend" });
        }
    });
    socket.on("get_friend_statuses", async (callback) => {
        try {
            const friends = await connection_1.default.any(`SELECT u.id, u.username, 
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
    });
};
exports.setupFriendsHandlers = setupFriendsHandlers;
//# sourceMappingURL=friends.js.map