import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("userFriends", {
    user_friend_id: "id",
    friend_id: {
      type: "integer",
      notNull: true,
      references: '"users"',
    },
    user_id: {
      type: "integer",
      notNull: true,
      references: '"users"',
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("userFriend");
}
