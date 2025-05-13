import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  await db.none(`
    CREATE TABLE userFriend (
      user_friend_id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, friend_id)
    );
    
    -- Create indexes for faster lookups
    CREATE INDEX IF NOT EXISTS idx_userFriend_user_id ON userFriend(user_id);
    CREATE INDEX IF NOT EXISTS idx_userFriend_friend_id ON userFriend(friend_id);
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TABLE IF EXISTS userFriend;
  `);
}