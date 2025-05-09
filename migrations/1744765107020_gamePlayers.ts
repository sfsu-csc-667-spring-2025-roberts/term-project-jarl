import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("gamePlayers", {
    game_player_id: "id",
    game_id: {
      type: "integer",
      notNull: true,
      references: '"games"',
      onDelete: "CASCADE",
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"',
      onDelete: "CASCADE",
    },
    joined_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("CURRENT_TIMESTAMP"),
    },
    is_host: {
      type: "boolean",
      notNull: true,
      default: false,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("gamePlayers");
}
