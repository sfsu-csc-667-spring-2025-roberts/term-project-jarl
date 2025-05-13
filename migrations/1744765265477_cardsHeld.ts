import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE cardsHeld (
      card_held_id SERIAL PRIMARY KEY,
      game_player_id INTEGER NOT NULL REFERENCES gamePlayers(game_player_id),
      card_id INTEGER NOT NULL REFERENCES cards(card_id)
    );
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE cardsHeld;
  `);
}