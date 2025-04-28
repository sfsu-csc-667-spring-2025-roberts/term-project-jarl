import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("gamePlayers", {
    // game_player_id: "id",
    // game_id: {
    //   type: "integer",
    //   notNull: true,
    //   references: '"games"',
    // },
    // user_id: {
    //   type: "integer",
    //   notNull: true,
    //   references: '"users"',
    // },
    // position: {
    //   type: "integer",
    //   notNull: true,
    // },
    // curr_bets: {
    //   type: "float",
    //   notNull: true,
    //   default: 0,
    // },
    // is_winner: {
    //   type: "boolean",
    //   notNull: true,
    //   default: false,
    // },
    // is_turn: {
    //   type: "boolean",
    //   notNull: true,
    //   default: false,
    // },
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
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("gamePlayers");
}
