"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
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
async function down(pgm) {
    pgm.dropTable("games");
}
//# sourceMappingURL=1744764452176_game.js.map