import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      balance NUMERIC(10,2) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance);
    
    -- Add constraints
    ALTER TABLE users ADD CONSTRAINT check_positive_balance CHECK (balance >= 0);
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE IF EXISTS users;
  `);
}