import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("game_state", {
    game_state_id: "id",
    game_id: {
      type: "integer",
      notNull: true,
      references: '"games"',
      onDelete: "CASCADE",
    },
    current_turn: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    num_players: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    dealer: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    last_raiser: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    current_bet: {
      type: "integer",
      notNull: true,
      default: 0,
    },
    pot: {
      type: "integer",
      notNull: true,
      default: 0,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game_state");
}
