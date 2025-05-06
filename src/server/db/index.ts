// src/server/db/index.ts
import db from './connection';
import UserModel from './models/user';
import GameModel from './models/game';

// Initialize models with the database connection
const userModel = new UserModel(db);
const gameModel = new GameModel(db);

// Export models for use in the application
export const User = userModel;
export const Game = gameModel;

// Export the database connection
export { db };