// src/server/db/connection.ts
import pgPromise from 'pg-promise';

// Initialize pg-promise with options
const pgp = pgPromise({
  // Initialization options
  capSQL: true, // capitalize SQL queries
  // Add any other options you need
});

// Get system username as default
const defaultUser = process.env.USER || "postgres";

// Database connection details
const connection = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "poker_game",
  user: process.env.DB_USER || defaultUser,
  password: process.env.DB_PASSWORD || "",
  max: 30 // Maximum number of connections
};

// Create the database instance
const db = pgp(connection);

// Export db as default
export default db;

// Also export pgp for modules that need it
export { pgp };