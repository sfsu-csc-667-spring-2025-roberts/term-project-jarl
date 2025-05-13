"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shorthands = void 0;
exports.up = up;
exports.down = down;
exports.shorthands = undefined;
async function up(pgm) {
    pgm.createTable("test_table", {
        id: "id",
        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("now()"),
        },
        test_string: {
            type: "varchar(1000)",
            notNull: true,
        },
    });
}
async function down(pgm) {
    pgm.dropTable("test_table");
}
//# sourceMappingURL=1744134645533_test-migration.js.map