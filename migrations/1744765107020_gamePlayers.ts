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
    seat: {
      type: "serial",
      notNull: true,
    },
    is_current: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    is_host: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    stack: {
      type: "float",
      notNull: true,
      default: 0,
    },
    is_in_hand: {
      type: "boolean",
      notNull: true,
      default: true,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("gamePlayers");
}
