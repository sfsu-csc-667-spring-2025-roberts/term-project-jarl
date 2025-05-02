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
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("games");
}
