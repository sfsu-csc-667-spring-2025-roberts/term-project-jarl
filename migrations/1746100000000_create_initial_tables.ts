// migrations/1746100000000_create_initial_tables.ts
import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  // Create fund_transactions table (consolidated version)
  await db.none(`
    CREATE TABLE IF NOT EXISTS fund_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'auto', 'balance_adjustment', 'transfer', 'winnings', 'bet')),
      status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
      payment_method VARCHAR(50),
      description TEXT,
      reference_id VARCHAR(255),
      game_id INTEGER REFERENCES games(game_id) ON DELETE SET NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_type ON fund_transactions(type);
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at);
  `);

  // Create trigger to update the updated_at timestamp
  await db.none(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

    CREATE TRIGGER update_fund_transactions_updated_at
        BEFORE UPDATE ON fund_transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  `);

  // Create trigger to log balance changes
  await db.none(`
    CREATE OR REPLACE FUNCTION log_balance_change()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.balance != OLD.balance THEN
        INSERT INTO fund_transactions (user_id, amount, type, description)
        VALUES (NEW.id, NEW.balance - OLD.balance, 'auto', 'Balance changed from ' || OLD.balance || ' to ' || NEW.balance);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER balance_change_trigger
    AFTER UPDATE OF balance ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_balance_change();
  `);
}

export async function down(db: IDatabase<{}>) {
  await db.none(`
    DROP TRIGGER IF EXISTS balance_change_trigger ON users;
    DROP TRIGGER IF EXISTS update_fund_transactions_updated_at ON fund_transactions;
    DROP FUNCTION IF EXISTS log_balance_change();
    DROP FUNCTION IF EXISTS update_updated_at_column();
    DROP TABLE IF EXISTS fund_transactions;
  `);
}