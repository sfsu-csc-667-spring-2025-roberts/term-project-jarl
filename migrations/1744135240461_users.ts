import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("users", {
    user_id: "id",
    email: {
      type: "varchar(255)",
      notNull: true,
      unique: true,
    },
    username: {
      type: "varchar(255)",
      notNull: true,
    },
    password: {
      type: "varchar(255)",
      notNull: true,
    },
    funds: {
      type: "float",
      notNull: true,
      default: 0,
    },
    is_signed_in: {
      type: "boolean",
      notNull: true,
      default: false,
    },
    // add pfp here
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("users");
}
