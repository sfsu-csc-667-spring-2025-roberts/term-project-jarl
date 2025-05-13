import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  // Simple test migration
  await db.none(`
    -- Test migration to verify connection
    CREATE TABLE IF NOT EXISTS test_table (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255)
    );
  `);
  
  // Insert a test record
  await db.none(`
    INSERT INTO test_table (name) VALUES ('Migration test successful');
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE IF EXISTS test_table;
  `);
}