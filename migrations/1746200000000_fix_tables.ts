// migrations/1746200000000_fix_tables.ts
import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  // Add indexes for better performance
  await db.none(`
    CREATE INDEX IF NOT EXISTS idx_game_players_game_id ON gamePlayers(game_id);
    CREATE INDEX IF NOT EXISTS idx_game_players_user_id ON gamePlayers(user_id);
  `);

  // Fix any existing invalid data
  await db.none(`
    UPDATE users SET balance = 0 WHERE balance IS NULL;
    UPDATE games SET state = 'FINISHED' WHERE state NOT IN ('WAITING', 'ACTIVE', 'FINISHED');
  `);

  // Add uniqueness constraint to prevent duplicate game players
  await db.none(`
    ALTER TABLE gamePlayers 
    ADD CONSTRAINT IF NOT EXISTS unique_game_player UNIQUE (game_id, user_id);
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    ALTER TABLE gamePlayers DROP CONSTRAINT IF EXISTS unique_game_player;
    DROP INDEX IF EXISTS idx_game_players_game_id;
    DROP INDEX IF EXISTS idx_game_players_user_id;
  `);
}