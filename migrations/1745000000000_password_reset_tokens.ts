import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE password_reset_tokens (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
    CREATE INDEX idx_password_reset_tokens_email ON password_reset_tokens(email);
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE password_reset_tokens;
  `);
}