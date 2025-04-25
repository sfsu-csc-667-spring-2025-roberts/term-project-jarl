import { QueryFile } from "pg-promise";
import path from "path";

export default {
  up: new QueryFile(
    path.join(__dirname, "1745000000000_password_reset_tokens.sql"),
  ),
  down: new QueryFile(
    path.join(__dirname, "1745000000000_password_reset_tokens_down.sql"),
  ),
};

// // Uncomment the following code if you want to use the migration builder directly instead of SQL files
// import type { MigrationBuilder } from "node-pg-migrate";

// export const up = (pgm: MigrationBuilder) => {
//   pgm.createTable("password_reset_tokens", {
//     id: { type: "serial", primaryKey: true },
//     email: { type: "VARCHAR(255)", notNull: true },
//     token: { type: "VARCHAR(255)", notNull: true, unique: true },
//     expires_at: { type: "TIMESTAMP", notNull: true },
//     created_at: {
//       type: "TIMESTAMP",
//       default: pgm.func("CURRENT_TIMESTAMP"),
//     },
//   });

//   pgm.createIndex("password_reset_tokens", "token");
//   pgm.createIndex("password_reset_tokens", "email");
// };

// export const down = (pgm: MigrationBuilder) => {
//   pgm.dropTable("password_reset_tokens");
// };
