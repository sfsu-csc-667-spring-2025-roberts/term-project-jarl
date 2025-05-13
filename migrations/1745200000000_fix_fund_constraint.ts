// migrations/1745200000000_fix_fund_constraint.ts
import { IDatabase } from 'pg-promise';

export async function up(db: IDatabase<{}>) {
  // Fix the transaction_type constraint to allow 'auto' and 'balance_adjustment'
  await db.none(`
    -- Drop existing constraint
    ALTER TABLE fund_transactions DROP CONSTRAINT IF EXISTS fund_transactions_type_check;
    
    -- Change column name from transaction_type to type (as the error shows 'type')
    ALTER TABLE fund_transactions RENAME COLUMN transaction_type TO type;
    
    -- Add new constraint with additional allowed values
    ALTER TABLE fund_transactions ADD CONSTRAINT fund_transactions_type_check 
      CHECK (type IN ('deposit', 'withdrawal', 'auto', 'balance_adjustment'));
  `);
}

export async function down(db: IDatabase<{}>) {
  // Revert to original constraint
  await db.none(`
    -- Drop current constraint
    ALTER TABLE fund_transactions DROP CONSTRAINT IF EXISTS fund_transactions_type_check;
    
    -- Rename column back
    ALTER TABLE fund_transactions RENAME COLUMN type TO transaction_type;
    
    -- Add back original constraint
    ALTER TABLE fund_transactions ADD CONSTRAINT fund_transactions_type_check 
      CHECK (transaction_type IN ('deposit', 'withdrawal'));
  `);
}