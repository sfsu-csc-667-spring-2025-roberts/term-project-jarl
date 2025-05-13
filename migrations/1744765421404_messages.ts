import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE messages (
      message_id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      author INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      isLobby BOOLEAN NOT NULL DEFAULT false,
      game_player_id INTEGER NOT NULL REFERENCES gamePlayers(game_player_id)
    );
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE messages;
  `);
}