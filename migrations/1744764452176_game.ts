import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("games", {
    game_id: "id",
    name: {
      type: "varchar(255)",
    },
    min_players: {
      type: "integer",
      notNull: true,
    },
    max_players: {
      type: "integer",
      notNull: true,
    },
    password: {
      type: "varchar(255)",
      notNull: false,
    },
    turn: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    pot_size: {
      type: "float",
      notNull: true,
      default: 0,
    },
    min_bet: {
      type: "float",
      notNull: true,
      default: 0,
    },
    round: {
      type: "integer",
      notNull: true,
      default: 0,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("games");
}
