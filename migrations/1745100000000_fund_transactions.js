"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
// src/server/db/migrations/1745100000000_fund_transactions.ts
const connection_1 = require("../connection");
const up = () => __awaiter(void 0, void 0, void 0, function* () {
    return connection_1.pgp.db.none(`
    CREATE TABLE IF NOT EXISTS fund_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount DECIMAL(10, 2) NOT NULL,
      transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
      status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
      payment_method VARCHAR(50),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create an index for faster queries
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_user_id ON fund_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_fund_transactions_created_at ON fund_transactions(created_at);

    -- Add a trigger to update the updated_at timestamp
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
});
exports.up = up;
const down = () => __awaiter(void 0, void 0, void 0, function* () {
    return connection_1.pgp.db.none(`
    DROP TRIGGER IF EXISTS update_fund_transactions_updated_at ON fund_transactions;
    DROP FUNCTION IF EXISTS update_updated_at_column();
    DROP TABLE IF EXISTS fund_transactions;
  `);
});
exports.down = down;
