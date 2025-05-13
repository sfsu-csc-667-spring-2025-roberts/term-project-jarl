import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE gameCards (
      game_card_id SERIAL PRIMARY KEY,
      game_id INTEGER NOT NULL REFERENCES games(game_id),
      card_id INTEGER NOT NULL REFERENCES cards(card_id)
    );
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE gameCards;
  `);
}