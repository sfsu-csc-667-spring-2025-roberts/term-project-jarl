"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
    pgm.createTable("cards", {
        card_id: "id",
        value: {
            type: "varchar(255)",
            notNull: true,
        },
        shape: {
            type: "varchar(255)",
            notNull: true,
        },
    });
}
async function down(pgm) {
    pgm.dropTable("cards");
}
//# sourceMappingURL=1744764581809_card.js.map