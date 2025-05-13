"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
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
    });
}
async function down(pgm) {
    pgm.dropTable("users");
}
//# sourceMappingURL=1744135240461_users.js.map