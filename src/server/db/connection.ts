// src/server/db/connection.ts
import pgPromise from "pg-promise";
import dotenv from "dotenv";

dotenv.config();

// Initialize pg-promise with options (empty for now, but you can add options later)
const pgp = pgPromise();

// Create the database connection
const db = pgp({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export default db;
