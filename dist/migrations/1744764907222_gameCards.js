"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
    pgm.createTable("gameCards", {
        game_card_id: "id",
        game_id: {
            type: "integer",
            notNull: true,
            references: '"games"',
        },
        card_id: {
            type: "integer",
            notNull: true,
            references: '"cards"',
        },
    });
}
async function down(pgm) {
    pgm.dropTable("gameCards");
}
//# sourceMappingURL=1744764907222_gameCards.js.map