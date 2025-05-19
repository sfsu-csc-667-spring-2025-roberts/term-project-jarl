"use strict";
// import { QueryFile } from "pg-promise";
// import path from "path";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
const up = (pgm) => {
  pgm.createTable("password_reset_tokens", {
    id: { type: "serial", primaryKey: true },
    email: { type: "VARCHAR(255)", notNull: true },
    token: { type: "VARCHAR(255)", notNull: true, unique: true },
    expires_at: { type: "TIMESTAMP", notNull: true },
    created_at: {
      type: "TIMESTAMP",
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
  });
  pgm.createIndex("password_reset_tokens", "token");
  pgm.createIndex("password_reset_tokens", "email");
};
exports.up = up;
const down = (pgm) => {
  pgm.dropTable("password_reset_tokens");
};
exports.down = down;
