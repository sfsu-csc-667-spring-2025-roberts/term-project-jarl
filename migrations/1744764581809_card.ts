import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE cards (
      card_id SERIAL PRIMARY KEY,
      value VARCHAR(255) NOT NULL,
      shape VARCHAR(255) NOT NULL
    );
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE cards;
  `);
}