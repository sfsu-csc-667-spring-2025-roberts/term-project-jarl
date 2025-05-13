"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
exports.rollbackLastMigration = rollbackLastMigration;
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const connection_1 = __importDefault(require("../connection"));
const migrationFiles = [
    '01_create_tables.sql',
    '02_add_balance_to_users.sql',
    '03_create_fund_transactions.sql'
];
async function runMigrations() {
    try {
        console.log('Starting database migrations...');
        await connection_1.default.none(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        for (const fileName of migrationFiles) {
            const existing = await connection_1.default.oneOrNone('SELECT id FROM schema_migrations WHERE name = $1', [fileName]);
            if (existing) {
                console.log(`Migration ${fileName} already applied, skipping...`);
                continue;
            }
            console.log(`Running migration: ${fileName}`);
            const migrationPath = path_1.default.join(__dirname, fileName);
            const migrationSQL = await promises_1.default.readFile(migrationPath, 'utf-8');
            await connection_1.default.none(migrationSQL);
            await connection_1.default.none('INSERT INTO schema_migrations (name) VALUES ($1)', [fileName]);
            console.log(`Migration ${fileName} completed successfully`);
        }
        console.log('All migrations completed successfully!');
    }
    catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}
async function rollbackLastMigration() {
    try {
        const lastMigration = await connection_1.default.oneOrNone(`
      SELECT name FROM schema_migrations 
      ORDER BY applied_at DESC 
      LIMIT 1
    `);
        if (!lastMigration) {
            console.log('No migrations to rollback');
            return;
        }
        console.log(`Rolling back migration: ${lastMigration.name}`);
        await connection_1.default.none('DELETE FROM schema_migrations WHERE name = $1', [lastMigration.name]);
        console.log(`Rollback completed: ${lastMigration.name}`);
    }
    catch (error) {
        console.error('Rollback failed:', error);
        process.exit(1);
    }
}
const command = process.argv[2];
switch (command) {
    case 'rollback':
        rollbackLastMigration();
        break;
    case 'run':
    default:
        runMigrations();
        break;
}
//# sourceMappingURL=run.js.map