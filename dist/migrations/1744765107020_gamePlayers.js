"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
    pgm.createTable("gamePlayers", {
        game_player_id: "id",
        game_id: {
            type: "integer",
            notNull: true,
            references: '"games"',
            onDelete: "CASCADE",
        },
        user_id: {
            type: "integer",
            notNull: true,
            references: '"users"',
            onDelete: "CASCADE",
        },
        seat: {
            type: "serial",
            notNull: true,
        },
        is_current: {
            type: "boolean",
            notNull: true,
            default: false,
        },
        is_host: {
            type: "boolean",
            notNull: true,
            default: false,
        },
    });
}
async function down(pgm) {
    pgm.dropTable("gamePlayers");
}
//# sourceMappingURL=1744765107020_gamePlayers.js.map