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
    status: {
      type: "varchar(50)",
      notNull: true,
      default: "'pending'",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });
  pgm.addConstraint("userFriends", "unique_user_friend", {
    unique: ["user_id", "friend_id"],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("userFriends");
}
