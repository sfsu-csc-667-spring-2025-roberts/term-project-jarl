// migrations/run.ts
import 'dotenv/config';
import pgp from 'pg-promise';
import { IDatabase } from 'pg-promise';
import fs from 'fs';
import path from 'path';

// Create database URL from individual settings
const dbUrl = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Check if we have database connection details
if (!dbUrl || dbUrl === 'postgresql://undefined:undefined@undefined:undefined/undefined') {
  console.error('ERROR: Database connection details are not set');
  console.error('Please ensure you have either DATABASE_URL or DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in your .env file');
  process.exit(1);
}

console.log('Connecting to database:', dbUrl.replace(/:[^:]*@/, ':****@'));

const pgpInstance = pgp();
const db: IDatabase<{}> = pgpInstance(dbUrl);

interface Migration {
  up: (db: IDatabase<{}>) => Promise<void>;
  down: (db: IDatabase<{}>) => Promise<void>;
}

async function runMigrations() {
  try {
    // Test database connection first
    console.log('Testing database connection...');
    await db.any('SELECT NOW()');
    console.log('Database connection successful');

    // Create migrations table if it doesn't exist
    await db.none(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get all migration files (.ts and .sql)
    const migrationsDir = __dirname;
    const files = fs.readdirSync(migrationsDir)
      .filter(file => 
        (file.endsWith('.ts') || file.endsWith('.sql')) && 
        file !== 'run.ts' && 
        !file.startsWith('.') &&
        !file.endsWith('.bak')
      )
      .sort();

    // Get already executed migrations
    const executed = await db.manyOrNone<{ filename: string }>(
      'SELECT filename FROM _migrations ORDER BY executed_at'
    );
    const executedFiles = executed.map(row => row.filename);

    console.log('Found migration files:', files);
    console.log('Already executed:', executedFiles);

    // Run new migrations
    for (const file of files) {
      if (!executedFiles.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        try {
          const filePath = path.join(migrationsDir, file);
          
          if (file.endsWith('.sql')) {
            // Handle SQL files
            const sqlContent = fs.readFileSync(filePath, 'utf8');
            await db.none(sqlContent);
          } else if (file.endsWith('.ts')) {
            // Handle TypeScript files
            const migration: Migration = require(filePath);
            await migration.up(db);
          }
          
          // Record that this migration has been executed
          await db.none(
            'INSERT INTO _migrations (filename) VALUES ($1)',
            [file]
          );
          
          console.log(`✓ Completed: ${file}`);
        } catch (error) {
          console.error(`✗ Failed to run migration ${file}:`, error);
          throw error;
        }
      } else {
        console.log(`Skipping already executed: ${file}`);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await db.$pool.end();
  }
}

// Run migrations
runMigrations();