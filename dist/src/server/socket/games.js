"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupGamesHandlers = void 0;
const connection_1 = __importDefault(require("../db/connection"));
const setupGamesHandlers = (io, socket) => {
    let userId = socket.handshake.auth.user_id;
    if (typeof userId === 'string') {
        userId = parseInt(userId);
    }
    if (!userId || userId === 0 || isNaN(userId)) {
        console.warn("Games socket missing valid user_id in auth");
        return;
    }
    console.log(`Setting up games handlers for user ${userId}`);
    socket.on("join_game", async (gameId, callback) => {
        console.log(`User ${userId} is trying to join game ${gameId}`);
        try {
            if (!gameId || isNaN(parseInt(gameId))) {
                return callback({ success: false, error: "Invalid game ID" });
            }
            const gameIdNumber = parseInt(gameId);
            await connection_1.default.tx(async (t) => {
                const game = await t.oneOrNone("SELECT * FROM games WHERE id = $1", [gameIdNumber]);
                if (!game) {
                    return callback({ success: false, error: "Game not found" });
                }
                if (game.state !== 'WAITING' && game.state !== 'ACTIVE') {
                    return callback({ success: false, error: "Game is not accepting players" });
                }
                const playerCount = await t.one("SELECT COUNT(*) FROM game_players WHERE game_id = $1", [gameIdNumber]);
                if (parseInt(playerCount.count) >= game.max_players) {
                    return callback({ success: false, error: "Game is full" });
                }
                const existingPlayer = await t.oneOrNone("SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2", [gameIdNumber, userId]);
                if (!existingPlayer) {
                    await t.none(`INSERT INTO game_players(game_id, user_id, joined_at) 
             VALUES($1, $2, NOW())`, [gameIdNumber, userId]);
                    console.log(`Added user ${userId} to game ${gameIdNumber}`);
                }
                else {
                    console.log(`User ${userId} is already in game ${gameIdNumber}`);
                }
                const creator = await t.oneOrNone("SELECT username FROM users WHERE id = $1", [game.created_by]);
                const updatedPlayerInfo = await t.one(`SELECT 
            COUNT(*) as count,
            array_agg(u.username) as usernames
           FROM game_players gp
           JOIN users u ON gp.user_id = u.id
           WHERE gp.game_id = $1`, [gameIdNumber]);
                socket.join(`game:${gameIdNumber}`);
                console.log(`User ${userId} joined socket room game:${gameIdNumber}`);
                socket.to(`game:${gameIdNumber}`).emit("player_joined", {
                    game_id: gameIdNumber,
                    user_id: userId,
                    player_count: parseInt(updatedPlayerInfo.count),
                    players: updatedPlayerInfo.usernames,
                    game_name: game.name,
                    created_by: (creator === null || creator === void 0 ? void 0 : creator.username) || 'Unknown'
                });
                callback({
                    success: true,
                    message: "Joined game successfully",
                    game_id: gameIdNumber,
                    player_count: parseInt(updatedPlayerInfo.count),
                    players: updatedPlayerInfo.usernames,
                    game_state: game.state
                });
            });
        }
        catch (error) {
            console.error("Error joining game:", error);
            callback({ success: false, error: "Server error while joining game" });
        }
    });
    socket.on("leave_game", async (gameId, callback) => {
        console.log(`User ${userId} is trying to leave game ${gameId}`);
        try {
            if (!gameId || isNaN(parseInt(gameId))) {
                return callback({ success: false, error: "Invalid game ID" });
            }
            const gameIdNumber = parseInt(gameId);
            await connection_1.default.tx(async (t) => {
                const playerInGame = await t.oneOrNone("SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2", [gameIdNumber, userId]);
                if (!playerInGame) {
                    return callback({ success: false, error: "You are not in this game" });
                }
                await t.none("DELETE FROM game_players WHERE game_id = $1 AND user_id = $2", [gameIdNumber, userId]);
                const updatedPlayerInfo = await t.one(`SELECT 
            COUNT(*) as count,
            array_agg(u.username) as usernames
           FROM game_players gp
           JOIN users u ON gp.user_id = u.id
           WHERE gp.game_id = $1`, [gameIdNumber]);
                if (parseInt(updatedPlayerInfo.count) === 0) {
                    await t.none("UPDATE games SET state = 'FINISHED' WHERE id = $1", [gameIdNumber]);
                }
                socket.leave(`game:${gameIdNumber}`);
                console.log(`User ${userId} left socket room game:${gameIdNumber}`);
                socket.to(`game:${gameIdNumber}`).emit("player_left", {
                    game_id: gameIdNumber,
                    user_id: userId,
                    player_count: parseInt(updatedPlayerInfo.count),
                    players: updatedPlayerInfo.usernames || []
                });
                callback({
                    success: true,
                    player_count: parseInt(updatedPlayerInfo.count)
                });
            });
        }
        catch (error) {
            console.error("Error leaving game:", error);
            callback({ success: false, error: "Server error while leaving game" });
        }
    });
    socket.on("get_game_info", async (gameId, callback) => {
        try {
            if (!gameId || isNaN(parseInt(gameId))) {
                return callback({ success: false, error: "Invalid game ID" });
            }
            const gameIdNumber = parseInt(gameId);
            const gameInfo = await connection_1.default.one(`SELECT 
          g.*,
          u.username as creator_name,
          COUNT(gp.user_id) as current_players,
          array_agg(json_build_object('id', u2.id, 'username', u2.username)) as players
        FROM games g
        LEFT JOIN users u ON g.created_by = u.id
        LEFT JOIN game_players gp ON g.id = gp.game_id
        LEFT JOIN users u2 ON gp.user_id = u2.id
        WHERE g.id = $1
        GROUP BY g.id, u.username`, [gameIdNumber]);
            callback({
                success: true,
                game: gameInfo
            });
        }
        catch (error) {
            console.error("Error getting game info:", error);
            callback({ success: false, error: "Error fetching game information" });
        }
    });
    socket.on("disconnect", async () => {
        try {
            console.log(`User ${userId} disconnected, cleaning up game sessions`);
            await connection_1.default.tx(async (t) => {
                const playerGames = await t.any("SELECT game_id FROM game_players WHERE user_id = $1", [userId]);
                for (const game of playerGames) {
                    await t.none("DELETE FROM game_players WHERE game_id = $1 AND user_id = $2", [game.game_id, userId]);
                    const updatedPlayerInfo = await t.one(`SELECT 
              COUNT(*) as count,
              array_agg(u.username) as usernames
             FROM game_players gp
             JOIN users u ON gp.user_id = u.id
             WHERE gp.game_id = $1`, [game.game_id]);
                    if (parseInt(updatedPlayerInfo.count) === 0) {
                        await t.none("UPDATE games SET state = 'FINISHED' WHERE id = $1", [game.game_id]);
                    }
                    io.to(`game:${game.game_id}`).emit("player_left", {
                        game_id: game.game_id,
                        user_id: userId,
                        player_count: parseInt(updatedPlayerInfo.count),
                        players: updatedPlayerInfo.usernames || [],
                        reason: "disconnected"
                    });
                }
            });
        }
        catch (error) {
            console.error("Error handling disconnect for games:", error);
        }
    });
};
exports.setupGamesHandlers = setupGamesHandlers;
//# sourceMappingURL=games.js.map