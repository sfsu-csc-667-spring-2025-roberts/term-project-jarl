"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
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
async function down(pgm) {
    pgm.dropTable("userFriends");
}
//# sourceMappingURL=1744764124195_userFriend.js.map