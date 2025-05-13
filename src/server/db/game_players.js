// Add this to src/server/db/game_players.js or similar file

const db = require('./connection');

/**
 * Adds a player to a game with proper seat assignment
 */
async function addPlayerToGame(gameId, userId, chips = 1000) {
  return db.tx(async t => {
    // Check if player is already in the game
    const existingPlayer = await t.oneOrNone(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );
    
    if (existingPlayer) {
      return existingPlayer; // Player already in game
    }
    
    // Find the next available seat
    const takenSeats = await t.manyOrNone(
      'SELECT seat_position FROM game_players WHERE game_id = $1',
      [gameId]
    );
    
    const seatPositions = takenSeats.map(seat => seat.seat_position);
    let seatPosition = 1;
    
    // Find the first available seat
    while (seatPositions.includes(seatPosition)) {
      seatPosition++;
    }
    
    // Add player
    const player = await t.one(
      `
      INSERT INTO game_players
      (game_id, user_id, seat_position, chips, is_active, current_bet)
      VALUES ($1, $2, $3, $4, true, 0)
      RETURNING *
      `,
      [gameId, userId, seatPosition, chips]
    );
    
    // Update current_players
    await t.none(
      `
      UPDATE games
      SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1)
      WHERE id = $1
      `,
      [gameId]
    );
    
    return player;
  });
}

/**
 * Removes a player from a game
 */
async function removePlayerFromGame(gameId, userId) {
  return db.tx(async t => {
    // Check if player is in the game
    const player = await t.oneOrNone(
      'SELECT * FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );
    
    if (!player) {
      throw new Error('Player not in game');
    }
    
    // Remove player
    await t.none(
      'DELETE FROM game_players WHERE game_id = $1 AND user_id = $2',
      [gameId, userId]
    );
    
    // Update current_players
    await t.none(
      `
      UPDATE games
      SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1)
      WHERE id = $1
      `,
      [gameId]
    );
    
    // Check if game is empty
    const count = await t.one(
      'SELECT COUNT(*) FROM game_players WHERE game_id = $1',
      [gameId]
    );
    
    if (parseInt(count.count) === 0) {
      // Mark game as finished if empty
      await t.none(
        'UPDATE games SET state = $1 WHERE id = $2',
        ['FINISHED', gameId]
      );
    }
    
    return { 
      success: true, 
      removed: true,
      remainingPlayers: parseInt(count.count)
    };
  });
}

/**
 * Gets all players in a game with their user info
 */
async function getGamePlayers(gameId) {
  return db.manyOrNone(
    `
    SELECT gp.*, u.username
    FROM game_players gp
    JOIN users u ON gp.user_id = u.id
    WHERE gp.game_id = $1
    ORDER BY gp.seat_position
    `,
    [gameId]
  );
}

module.exports = {
  addPlayerToGame,
  removePlayerFromGame,
  getGamePlayers
};