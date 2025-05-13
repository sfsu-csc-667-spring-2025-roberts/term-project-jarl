// src/server/db/models/game.ts
import db from '../connection';

export enum GameState {
  WAITING = 'WAITING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED'
}

export interface Game {
  id: number;
  name: string;
  min_players: number;
  max_players: number;
  state: GameState;
  current_players: number;
  created_by: number;
  created_at: Date;
  buy_in?: number;
}

export default {
  /**
   * Create a new game
   */
  async create(name: string, maxPlayers: number, userId: number, buyIn: number = 1000): Promise<Game> {
    return db.one(
      `
      INSERT INTO games 
      (name, min_players, max_players, created_by, state, buy_in)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, min_players, max_players, state, created_by, created_at, buy_in
      `,
      [name, 2, maxPlayers, userId, GameState.WAITING, buyIn]
    );
  },
  
  /**
   * Find a game by ID
   */
  async findById(id: number): Promise<Game | null> {
    return db.oneOrNone(
      `
      SELECT g.*, 
             (SELECT COUNT(*) FROM game_players WHERE game_id = g.id) as current_players
      FROM games g
      WHERE g.id = $1
      `,
      [id]
    );
  },
  
  /**
   * Find all games
   */
  async findAll(): Promise<Game[]> {
    return db.manyOrNone(
      `
      SELECT g.*, 
             (SELECT COUNT(*) FROM game_players WHERE game_id = g.id) as current_players
      FROM games g
      ORDER BY g.created_at DESC
      `
    );
  },
  
  /**
   * Find active games
   */
  async findActive(): Promise<Game[]> {
    return db.manyOrNone(
      `
      SELECT g.*, 
             (SELECT COUNT(*) FROM game_players WHERE game_id = g.id) as current_players
      FROM games g
      WHERE g.state != $1
      ORDER BY g.created_at DESC
      `,
      [GameState.FINISHED]
    );
  },
  
  /**
   * Update game state
   */
  async updateState(id: number, state: GameState): Promise<void> {
    await db.none(
      `
      UPDATE games
      SET state = $1
      WHERE id = $2
      `,
      [state, id]
    );
  },
  
  /**
   * Get players in a game
   */
  async getPlayers(gameId: number) {
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
  },
  
  /**
   * Add player to game
   */
  async addPlayer(gameId: number, userId: number, chips: number = 1000): Promise<void> {
    // Find the next available seat
    const takenSeats = await db.manyOrNone(
      'SELECT seat_position FROM game_players WHERE game_id = $1',
      [gameId]
    );
    
    const seatPositions = takenSeats.map(seat => seat.seat_position);
    let seatPosition = 1;
    
    while (seatPositions.includes(seatPosition)) {
      seatPosition++;
    }
    
    await db.none(
      `
      INSERT INTO game_players
      (game_id, user_id, seat_position, chips, is_active, current_bet)
      VALUES ($1, $2, $3, $4, true, 0)
      `,
      [gameId, userId, seatPosition, chips]
    );
    
    // Update current_players
    await db.none(
      `
      UPDATE games
      SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1)
      WHERE id = $1
      `,
      [gameId]
    );
  },
  
  /**
   * Remove player from game
   */
  async removePlayer(gameId: number, userId: number): Promise<void> {
    await db.none(
      `
      DELETE FROM game_players
      WHERE game_id = $1 AND user_id = $2
      `,
      [gameId, userId]
    );
    
    // Update current_players
    await db.none(
      `
      UPDATE games
      SET current_players = (SELECT COUNT(*) FROM game_players WHERE game_id = $1)
      WHERE id = $1
      `,
      [gameId]
    );
    
    // Check if game is empty
    const playerCount = await db.one(
      'SELECT COUNT(*) FROM game_players WHERE game_id = $1',
      [gameId]
    );
    
    if (parseInt(playerCount.count) === 0) {
      await db.none(
        'UPDATE games SET state = $1 WHERE id = $2',
        [GameState.FINISHED, gameId]
      );
    }
  }
};