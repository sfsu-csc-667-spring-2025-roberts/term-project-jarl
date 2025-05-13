"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
    pgm.createTable("cardsHeld", {
        card_held_id: "id",
        game_player_id: {
            type: "integer",
            notNull: true,
            references: '"gamePlayers"',
        },
        card_id: {
            type: "integer",
            notNull: true,
            references: '"cards"',
        },
    });
}
async function down(pgm) {
    pgm.dropTable("cardsHeld");
}
//# sourceMappingURL=1744765265477_cardsHeld.js.map