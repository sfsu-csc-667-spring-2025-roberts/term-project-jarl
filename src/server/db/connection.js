"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
// src/server/db/connection.ts
const pg_promise_1 = __importDefault(require("pg-promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pgp = (0, pg_promise_1.default)();
const db = pgp(process.env.DATABASE_URL);
exports.default = db;
