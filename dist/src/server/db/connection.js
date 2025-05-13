"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pgp = void 0;
const pg_promise_1 = __importDefault(require("pg-promise"));
const pgp = (0, pg_promise_1.default)();
exports.pgp = pgp;
const defaultUser = process.env.USER || "postgres";
const connection = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "poker_game",
    user: process.env.DB_USER || defaultUser,
    password: process.env.DB_PASSWORD || "",
    max: 30
};
const db = pgp(connection);
exports.default = db;
//# sourceMappingURL=connection.js.map