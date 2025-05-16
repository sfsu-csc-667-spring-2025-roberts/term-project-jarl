import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("messages", {
    message_id: "id",
    content: {
      type: "text",
      notNull: true,
    },
    author: {
      type: "integer",
      notNull: true,
      references: '"users"',
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    isLobby: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    game_player_id: {
      type: "integer",
      notNull: false,
      references: '"gamePlayers"',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("messages");
}
