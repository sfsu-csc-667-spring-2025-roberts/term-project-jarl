import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE games (
      game_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      min_players INTEGER NOT NULL,
      max_players INTEGER NOT NULL,
      password VARCHAR(255),
      state VARCHAR(20) DEFAULT 'WAITING',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_game_state CHECK (state IN ('WAITING', 'ACTIVE', 'FINISHED'))
    );
    
    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_games_state ON games(state);
    CREATE INDEX IF NOT EXISTS idx_games_created_by ON games(created_by);
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE IF EXISTS games;
  `);
}