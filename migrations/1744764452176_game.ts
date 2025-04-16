import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("games", {
    game_id: "id",
    max_num_players: {
      type: "integer",
      notNull: true,
    },
    curr_num_players: {
      type: "integer",
      notNull: true,
    },
    curr_pot_size: {
      type: "float",
      notNull: true,
      default: 0,
    },
    buy_in: {
      type: "float",
      notNull: true,
      default: 0,
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("game");
}
