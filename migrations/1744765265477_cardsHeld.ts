import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("cardsHeld", {
    card_held_id: "id",
    game_player_id: {
      type: "integer",
      notNull: true,
      references: '"gamePlayers"',
      onDelete: "CASCADE",
    },
    card_id: {
      type: "integer",
      notNull: true,
      references: '"cards"',
      onDelete: "CASCADE",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("cardsHeld");
}
