"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
    pgm.createTable("messages", {
        message_id: "id",
        content: {
            type: "text",
            notNull: true,
        },
        author: {
            type: "integer",
            notNull: true,
            references: '"users"',
        },
        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
        isLobby: {
            type: "boolean",
            notNull: true,
            default: false,
        },
        game_player_id: {
            type: "integer",
            notNull: true,
            references: '"gamePlayers"',
        },
    });
}
async function down(pgm) {
    pgm.dropTable("messages");
}
//# sourceMappingURL=1744765421404_messages.js.map