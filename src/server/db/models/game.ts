// src/server/db/models/game.ts
import pgPromise from "pg-promise";

class Game {
  private db: pgPromise.IDatabase<any>;

  constructor(db: pgPromise.IDatabase<any>) {
    this.db = db;
  }

  async create(name: string, minPlayers: number, maxPlayers: number, password?: string) {
    return this.db.one(
      "INSERT INTO games(name, min_players, max_players, password) VALUES($1, $2, $3, $4) RETURNING game_id",
      [name, minPlayers, maxPlayers, password]
    );
  }

  async findById(id: number) {
    return this.db.oneOrNone(
      "SELECT * FROM games WHERE game_id = $1",
      [id]
    );
  }

  async getActiveGames() {
    return this.db.any(
      "SELECT * FROM games WHERE is_active = true"
    );
  }

  async joinGame(gameId: number, userId: number, isHost: boolean = false) {
    return this.db.none(
      "INSERT INTO game_players(game_id, user_id, is_host) VALUES($1, $2, $3)",
      [gameId, userId, isHost]
    );
  }

  async conditionalJoin(gameId: number, userId: number, password: string) {
    // SQL query to conditionally join a game based on various conditions
    const CONDITIONAL_JOIN_SQL = `
      INSERT INTO game_players (game_id, user_id)
      SELECT $(gameId), $(userId) 
      WHERE NOT EXISTS (
        SELECT 1 
        FROM game_players 
        WHERE game_id = $(gameId) AND user_id = $(userId)
      )
      AND (
        SELECT COUNT(*) FROM games WHERE game_id = $(gameId) AND password = $(password)
      ) = 1
      AND (
        (
          SELECT COUNT(*) FROM game_players WHERE game_id = $(gameId)
        ) < (
          SELECT max_players FROM games WHERE game_id = $(gameId)
        )
      )
      RETURNING (
        SELECT COUNT(*) FROM game_players WHERE game_id = $(gameId)
      ) as player_count
    `;

    try {
      const result = await this.db.one(CONDITIONAL_JOIN_SQL, {
        gameId,
        userId,
        password
      });
      return result.player_count;
    } catch (error) {
      console.error("Error in conditionalJoin:", error);
      throw error;
    }
  }

  async getPlayerCount(gameId: number) {
    const { count } = await this.db.one(
      "SELECT COUNT(*) FROM game_players WHERE game_id = $1",
      [gameId]
    );
    return count;
  }

  async getGamePlayers(gameId: number) {
    return this.db.any(
      `SELECT u.user_id, u.username, u.email, gp.is_host 
       FROM game_players gp
       JOIN users u ON gp.user_id = u.user_id
       WHERE gp.game_id = $1`,
      [gameId]
    );
  }
}

export default Game;