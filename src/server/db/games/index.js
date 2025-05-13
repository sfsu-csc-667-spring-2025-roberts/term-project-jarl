"use strict";
// File: src/server/db/games/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const game_1 = __importDefault(require("../models/game"));
// Export the complete GameModel including the methods that were causing errors
exports.default = game_1.default;
