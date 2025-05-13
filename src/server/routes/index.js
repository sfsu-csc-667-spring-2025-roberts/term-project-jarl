"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.friends = exports.funds = exports.lobby = exports.chat = exports.games = exports.auth = exports.test = exports.root = void 0;
// src/server/routes/index.ts
// Export all route modules for use in the application
const root_1 = __importDefault(require("./root"));
exports.root = root_1.default;
const test_1 = __importDefault(require("./test"));
exports.test = test_1.default;
const auth_1 = __importDefault(require("./auth"));
exports.auth = auth_1.default;
const games_1 = __importDefault(require("./games"));
exports.games = games_1.default;
const chat_1 = __importDefault(require("./chat"));
exports.chat = chat_1.default;
const lobby_1 = __importDefault(require("./lobby"));
exports.lobby = lobby_1.default;
const friends_1 = __importDefault(require("./friends"));
exports.friends = friends_1.default;
const funds_1 = __importDefault(require("./funds"));
exports.funds = funds_1.default;
