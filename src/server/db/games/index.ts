// src/server/db/games/index.ts
import db from '../connection';

export enum GameState {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED'
}

interface Game {
  id: number;
  name: string;
  min_players: number;
  max_players: number;
  state: GameState;
  password?: string;
  created_by: number;
  created_at: Date;
  creator_name?: string;
  current_players?: number;
  buy_in?: number;
}

export default {
  /**
   * Create a new game
   */
  async create(name: string, maxPlayers: number, userId: number, minBuyIn: number = 1000, isPrivate: boolean = false): Promise<Game> {
    console.log('Creating game:', { name, maxPlayers, userId, minBuyIn, isPrivate });
    
    try {
      // First, clear any existing player entries for the user
      await db.none(
        `DELETE FROM game_players 
         WHERE user_id = $1 AND game_id IN (
           SELECT id FROM games WHERE state = 'WAITING'
         )`,
        [userId]
      );
      
      // Create the new game
      const result = await db.one(
        `
        INSERT INTO games 
        (name, min_players, max_players, created_by, state, buy_in)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, name, min_players, max_players, state, created_by, created_at, buy_in
        `,
        [name, 2, maxPlayers, userId, GameState.WAITING, minBuyIn]
      );
      
      console.log('Game created successfully:', result);
      
      // Create a game player entry for the creator
      await db.none(
        `
        INSERT INTO game_players
        (game_id, user_id, seat_position, chips, is_active, current_bet)
        VALUES ($1, $2, 1, $3, true, 0)
        `,
        [result.id, userId, minBuyIn]
      );
      
      // Update current_players count
      await db.none(
        "UPDATE games SET current_players = 1 WHERE id = $1",
        [result.id]
      );
      
      return result;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  },
  
  /**
   * Find a game by ID
   */
  async findById(gameId: number): Promise<Game | null> {
    return db.oneOrNone(
      `
      SELECT g.id, g.name, g.min_players, g.max_players, g.state,
             g.password, g.created_by, g.created_at, g.buy_in,
             u.username as creator_name,
             (SELECT COUNT(*) FROM game_players gp WHERE gp.game_id = g.id) as current_players
      FROM games g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = $1
      `,
      [gameId]
    );
  },
  
  /**
   * Find all active games
   */
  async findActiveGames(): Promise<Game[]> {
    return db.manyOrNone(
      `
      SELECT g.id, g.name, g.min_players, g.max_players, g.state,
             g.created_by, g.created_at, g.buy_in,
             u.username as creator_name,
             (SELECT COUNT(*) FROM game_players gp WHERE gp.game_id = g.id) as current_players
      FROM games g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.state != $1
      ORDER BY g.created_at DESC
      `,
      [GameState.FINISHED]
    );
  },
  
  /**
   * Add a player to a game
   */
  async addPlayer(gameId: number, userId: number): Promise<void> {
    // Check if the player is already in the game
    const existingPlayer = await db.oneOrNone(
      `
      SELECT 1 FROM game_players
      WHERE game_id = $1 AND user_id = $2
      `,
      [gameId, userId]
    );
    
    if (existingPlayer) {
      throw new Error('Player already in game');
    }
    
    // Get the game to check max players
    const game = await db.one(
      `
      SELECT g.id, g.max_players, g.buy_in,
             (SELECT COUNT(*) FROM game_players WHERE game_id = g.id) as current_players
      FROM games g
      WHERE g.id = $1
      `,
      [gameId]
    );
    
    if (parseInt(game.current_players) >= game.max_players) {
      throw new Error('Game is full');
    }
    
    // Find next available seat
    const takenSeats = await db.manyOrNone(
      `SELECT seat_position FROM game_players WHERE game_id = $1`,
      [gameId]
    );
    
    const seatPositions = takenSeats.map(seat => seat.seat_position);
    let nextSeat = 1;
    while (seatPositions.includes(nextSeat) && nextSeat <= game.max_players) {
      nextSeat++;
    }
    
    if (nextSeat > game.max_players) {
      throw new Error('No available seats');
    }
    
    // Add the player
    await db.none(
      `
      INSERT INTO game_players
      (game_id, user_id, seat_position, chips, is_active, current_bet)
      VALUES ($1, $2, $3, $4, true, 0)
      `,
      [gameId, userId, nextSeat, game.buy_in || 1000]
    );
    
    // Update current_players count
    await db.none(
      "UPDATE games SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1) WHERE id = $1",
      [gameId]
    );
  },
  
  /**
   * Remove a player from a game
   */
  async removePlayer(gameId: number, userId: number): Promise<void> {
    // Verify player is in the game
    const player = await db.oneOrNone(
      `SELECT 1 FROM game_players WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );
    
    if (!player) {
      throw new Error('Player not in game');
    }
    
    // Remove the player
    await db.none(
      `DELETE FROM game_players WHERE game_id = $1 AND user_id = $2`,
      [gameId, userId]
    );
    
    // Update current_players count
    await db.none(
      "UPDATE games SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1) WHERE id = $1",
      [gameId]
    );
    
    // Check if game is empty
    const playersLeft = await db.one(
      `SELECT COUNT(*) FROM game_players WHERE game_id = $1`,
      [gameId]
    );
    
    if (parseInt(playersLeft.count) === 0) {
      // Mark game as finished if empty
      await db.none(
        `UPDATE games SET state = $1 WHERE id = $2`,
        [GameState.FINISHED, gameId]
      );
    }
  },
  
  /**
   * Get all players in a game
   */
  async getPlayers(gameId: number) {
    return db.manyOrNone(
      `
      SELECT gp.id, gp.game_id, gp.user_id, gp.seat_position, gp.chips, gp.is_active, gp.current_bet,
             u.username
      FROM game_players gp
      JOIN users u ON gp.user_id = u.id
      WHERE gp.game_id = $1
      ORDER BY gp.seat_position
      `,
      [gameId]
    );
  },
  
  /**
   * Update game state
   */
  async updateState(gameId: number, state: GameState): Promise<void> {
    await db.none(
      `
      UPDATE games
      SET state = $1
      WHERE id = $2
      `,
      [state, gameId]
    );
  }
};