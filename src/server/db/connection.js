"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgp = void 0;

// Initialize pg-promise with options
var pgPromise = require("pg-promise");
var pgp = pgPromise({
  // Initialization options
  capSQL: true // capitalize SQL queries
});
exports.pgp = pgp;

// Get system username as default
var defaultUser = process.env.USER || "postgres";

// Database connection details
var connection = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "poker_game",
  user: process.env.DB_USER || defaultUser,
  password: process.env.DB_PASSWORD || "",
  max: 30 // Maximum number of connections
};

// Create the database instance
var db = pgp(connection);

// Export db as default
exports.default = db;