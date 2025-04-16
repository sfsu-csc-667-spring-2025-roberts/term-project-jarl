import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("gameCards", {
    game_card_id: "id",
    game_id: {
      type: "integer",
      notNull: true,
      references: '"games"',
    },
    card_id: {
      type: "integer",
      notNull: true,
      references: '"cards"',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("gameCards");
}
