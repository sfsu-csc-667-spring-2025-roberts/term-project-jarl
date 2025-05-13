// src/server/socket/games.js
const db = require('../db/connection');
const pgp = require('pg-promise')();

// Map to track socket IDs for direct messaging
const userSocketMap = new Map();

// Create a direct database connection for reliable access
const connection = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "poker_game",
  user: process.env.DB_USER || process.env.USER || "postgres",
  password: process.env.DB_PASSWORD || ""
};

// Create a fresh database connection
const directDb = pgp(connection);

const setupGamesHandlers = (io, socket) => {
  // Get user ID from auth data
  let userId = socket.handshake.auth.user_id;
  
  // Convert string to number if needed
  if (typeof userId === 'string') {
    userId = parseInt(userId);
  }
  
  if (!userId || userId === 0 || isNaN(userId)) {
    console.warn("Games socket missing valid user_id in auth");
    return;
  }
  
  console.log(`Setting up games handlers for user ${userId}`);
  
  // Store socket ID for this user
  userSocketMap.set(userId, socket.id);
  
  // Join a game
  socket.on("join_game", async (gameId, callback) => {
    console.log(`User ${userId} is trying to join game ${gameId}`);
    
    try {
      // Validate gameId
      const gameIdNumber = parseInt(String(gameId));
      
      if (isNaN(gameIdNumber)) {
        return callback({ success: false, error: "Invalid game ID" });
      }
      
      // Use our direct DB connection
      const game = await directDb.oneOrNone("SELECT * FROM games WHERE id = $1", [gameIdNumber]);
      
      if (!game) {
        return callback({ success: false, error: "Game not found" });
      }
      
      // Check if the game is full
      const playerCount = await directDb.one("SELECT COUNT(*) FROM game_players WHERE game_id = $1", [gameIdNumber]);
      
      if (parseInt(playerCount.count) >= game.max_players) {
        return callback({ success: false, error: "Game is full" });
      }
      
      // Check if player is already in the game
      const existingPlayer = await directDb.oneOrNone(
        "SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2",
        [gameIdNumber, userId]
      );
      
      let playerAdded = false;
      
      if (!existingPlayer) {
        // Find the next available seat position
        const takenPositions = await directDb.manyOrNone(
          "SELECT seat_position FROM game_players WHERE game_id = $1",
          [gameIdNumber]
        );
        
        // Find first available position (1 to max_players)
        const takenSeats = takenPositions.map(p => p.seat_position);
        let seatPosition = 1;
        while (takenSeats.includes(seatPosition) && seatPosition <= game.max_players) {
          seatPosition++;
        }
        
        if (seatPosition > game.max_players) {
          return callback({ success: false, error: "No available seats" });
        }
        
        // Add player to the game with a seat position
        await directDb.none(
          `INSERT INTO game_players(game_id, user_id, seat_position, chips, is_active, current_bet) 
           VALUES($1, $2, $3, $4, true, 0)`,
          [gameIdNumber, userId, seatPosition, game.buy_in || 1000]
        );
        
        console.log(`Added user ${userId} to game ${gameIdNumber} at seat ${seatPosition}`);
        playerAdded = true;
      } else {
        console.log(`User ${userId} is already in game ${gameIdNumber}`);
      }
      
      // Update current_players count in the games table
      await directDb.none(
        "UPDATE games SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1) WHERE id = $1",
        [gameIdNumber]
      );
      
      // Get all players
      const players = await directDb.manyOrNone(
        `SELECT gp.*, u.username 
         FROM game_players gp
         JOIN users u ON gp.user_id = u.id
         WHERE gp.game_id = $1
         ORDER BY gp.seat_position`,
        [gameIdNumber]
      );
      
      // Join the game room
      socket.join(`game:${gameIdNumber}`);
      console.log(`User ${userId} joined socket room game:${gameIdNumber}`);
      
      // Notify other players
      if (playerAdded) {
        socket.to(`game:${gameIdNumber}`).emit("player_joined", {
          game_id: gameIdNumber,
          user_id: userId,
          player_count: players.length,
          players: players.map(p => ({ 
            id: p.user_id, 
            username: p.username,
            seat: p.seat_position
          })),
          game_name: game.name
        });
      }
      
      // Return success
      callback({ 
        success: true, 
        message: "Joined game successfully",
        game: game,
        players: players.map(p => ({ 
          id: p.user_id, 
          username: p.username,
          seat: p.seat_position,
          chips: p.chips
        }))
      });
      
    } catch (error) {
      console.error("Error joining game:", error);
      callback({ success: false, error: error.message || "Error joining game" });
    }
  });
  
  // Start a game
  socket.on("start_game", async (gameId, callback) => {
    console.log(`User ${userId} is trying to start game ${gameId}`);
    
    try {
      // Validate gameId
      const gameIdNumber = parseInt(String(gameId));
      
      if (isNaN(gameIdNumber)) {
        return callback({ success: false, error: "Invalid game ID" });
      }
      
      // Get the game
      const game = await directDb.oneOrNone("SELECT * FROM games WHERE id = $1", [gameIdNumber]);
      
      if (!game) {
        return callback({ success: false, error: "Game not found" });
      }
      
      if (game.created_by !== userId) {
        return callback({ success: false, error: "Only the game creator can start the game" });
      }
      
      // Check if there are enough players
      const playerCount = await directDb.one(
        "SELECT COUNT(*) FROM game_players WHERE game_id = $1", [gameIdNumber]
      );
      
      if (parseInt(playerCount.count) < 2) {
        return callback({ success: false, error: "Need at least 2 players to start the game" });
      }
      
      // Update game state to ACTIVE
      await directDb.none(
        "UPDATE games SET state = $1 WHERE id = $2", ['ACTIVE', gameIdNumber]
      );
      
      // Get all players
      const players = await directDb.manyOrNone(
        `SELECT gp.*, u.username 
         FROM game_players gp
         JOIN users u ON gp.user_id = u.id
         WHERE gp.game_id = $1
         ORDER BY gp.seat_position`,
        [gameIdNumber]
      );
      
      // Generate community cards for the game
      const communityCards = generateRandomCards(5);
      
      // Deal cards to each player
      for (const player of players) {
        // Generate random cards for each player
        const cards = generateRandomCards(2);
        
        // Send cards to the specific player only
        const playerSocketId = userSocketMap.get(player.user_id);
        if (playerSocketId) {
          io.to(playerSocketId).emit('cards_dealt', {
            game_id: gameIdNumber,
            cards: cards
          });
        }
      }
      
      // Notify all players in the game that the game has started
      io.to(`game:${gameIdNumber}`).emit("game_started", {
        game_id: gameIdNumber,
        players: players.map(p => ({
          id: p.user_id,
          username: p.username,
          chips: p.chips,
          seat_position: p.seat_position
        })),
        state: 'ACTIVE',
        communityCards: communityCards
      });
      
      // Return success
      callback({ success: true });
      
    } catch (error) {
      console.error("Error starting game:", error);
      callback({ success: false, error: error.message || "Error starting game" });
    }
  });
  
  // Leave a game
  socket.on("leave_game", async (gameId, callback) => {
    console.log(`User ${userId} is trying to leave game ${gameId}`);
    
    try {
      // Validate gameId
      const gameIdNumber = parseInt(String(gameId));
      
      if (isNaN(gameIdNumber)) {
        return callback({ success: false, error: "Invalid game ID" });
      }
      
      // Check if player is in the game
      const playerInGame = await directDb.oneOrNone(
        "SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2",
        [gameIdNumber, userId]
      );
      
      if (!playerInGame) {
        return callback({ success: false, error: "You are not in this game" });
      }
      
      // Remove player from the game
      await directDb.none(
        "DELETE FROM game_players WHERE game_id = $1 AND user_id = $2",
        [gameIdNumber, userId]
      );
      
      // Update current_players count in the games table
      await directDb.none(
        "UPDATE games SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1) WHERE id = $1",
        [gameIdNumber]
      );
      
      // Check if the game is now empty
      const remainingPlayers = await directDb.one(
        "SELECT COUNT(*) FROM game_players WHERE game_id = $1",
        [gameIdNumber]
      );
      
      if (parseInt(remainingPlayers.count) === 0) {
        // If no players left, mark the game as finished
        await directDb.none(
          "UPDATE games SET state = $1 WHERE id = $2",
          ['FINISHED', gameIdNumber]
        );
      }
      
      // Get the remaining players
      const players = await directDb.manyOrNone(
        `SELECT gp.*, u.username 
         FROM game_players gp
         JOIN users u ON gp.user_id = u.id
         WHERE gp.game_id = $1
         ORDER BY gp.seat_position`,
        [gameIdNumber]
      );
      
      // Leave the game room
      socket.leave(`game:${gameIdNumber}`);
      console.log(`User ${userId} left socket room game:${gameIdNumber}`);
      
      // Notify other players
      socket.to(`game:${gameIdNumber}`).emit("player_left", {
        game_id: gameIdNumber,
        user_id: userId,
        player_count: parseInt(remainingPlayers.count),
        players: players.map(p => ({ 
          id: p.user_id, 
          username: p.username,
          seat: p.seat_position
        }))
      });
      
      // Return success
      callback({ success: true });
      
    } catch (error) {
      console.error("Error leaving game:", error);
      callback({ success: false, error: error.message || "Error leaving game" });
    }
  });
  
  // Handle disconnect
  socket.on("disconnect", async () => {
    try {
      console.log(`User ${userId} disconnected, cleaning up game sessions`);
      
      try {
        // Find all games the player is in
        const playerGames = await directDb.manyOrNone(
          "SELECT game_id FROM game_players WHERE user_id = $1",
          [userId]
        );
        
        // Clean up for each game
        for (const gameData of playerGames) {
          try {
            const gameId = gameData.game_id;
            
            // Remove player from the game
            await directDb.none(
              "DELETE FROM game_players WHERE game_id = $1 AND user_id = $2",
              [gameId, userId]
            );
            
            // Update current_players count
            await directDb.none(
              "UPDATE games SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1) WHERE id = $1",
              [gameId]
            );
            
            // Check if the game is now empty
            const remainingPlayers = await directDb.one(
              "SELECT COUNT(*) FROM game_players WHERE game_id = $1",
              [gameId]
            );
            
            if (parseInt(remainingPlayers.count) === 0) {
              // If no players left, mark the game as finished
              await directDb.none(
                "UPDATE games SET state = $1 WHERE id = $2",
                ['FINISHED', gameId]
              );
            }
            
            // Get the remaining players
            const players = await directDb.manyOrNone(
              `SELECT gp.*, u.username 
               FROM game_players gp
               JOIN users u ON gp.user_id = u.id
               WHERE gp.game_id = $1
               ORDER BY gp.seat_position`,
              [gameId]
            );
            
            // Notify other players
            io.to(`game:${gameId}`).emit("player_left", {
              game_id: gameId,
              user_id: userId,
              player_count: parseInt(remainingPlayers.count),
              players: players.map(p => ({ 
                id: p.user_id, 
                username: p.username,
                seat: p.seat_position
              })),
              reason: "disconnected"
            });
          } catch (error) {
            console.error(`Error handling disconnect for game ${gameData.game_id}:`, error);
          }
        }
      } catch (error) {
        console.error("Error cleaning up player games:", error);
      }
      
      // Clean up map
      userSocketMap.delete(userId);
      
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  });
};

// Helper function to generate random cards (for demonstration purposes)
function generateRandomCards(count) {
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
  const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
  
  const cards = [];
  const usedCards = new Set();
  
  while (cards.length < count) {
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    const card = `${rank}${suit}`;
    
    if (!usedCards.has(card)) {
      cards.push(card);
      usedCards.add(card);
    }
  }
  
  return cards;
}

module.exports = { setupGamesHandlers };