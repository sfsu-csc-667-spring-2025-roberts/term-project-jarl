import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE gamePlayers (
      game_player_id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seat SERIAL NOT NULL,
      is_current BOOLEAN NOT NULL DEFAULT false,
      is_host BOOLEAN NOT NULL DEFAULT false
    );
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE gamePlayers;
  `);
}