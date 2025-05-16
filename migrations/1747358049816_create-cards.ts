import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // create a deck of cards where each card has a shape, color, and value
  // make ace a value of 14, jack=11, queen=12, and king=13

  // the cards table is already created, just create the cards
  pgm.sql(`
        INSERT INTO cards (value, shape)
        VALUES
        ('2', 'hearts'),
        ('3', 'hearts'),
        ('4', 'hearts'),
        ('5', 'hearts'),
        ('6', 'hearts'),
        ('7', 'hearts'),
        ('8', 'hearts'),
        ('9', 'hearts'),
        ('10', 'hearts'),
        ('11', 'hearts'),
        ('12', 'hearts'),
        ('13', 'hearts'),
        ('14', 'hearts'),
        ('2', 'diamonds'),
        ('3', 'diamonds'),
        ('4', 'diamonds'),
        ('5', 'diamonds'),
        ('6', 'diamonds'),
        ('7', 'diamonds'),
        ('8', 'diamonds'),
        ('9', 'diamonds'),
        ('10', 'diamonds'),
        ('11', 'diamonds'),
        ('12', 'diamonds'),
        ('13', 'diamonds'),
        ('14', 'diamonds'),
        ('2', 'clubs'),
        ('3', 'clubs'),
        ('4', 'clubs'),
        ('5', 'clubs'),
        ('6', 'clubs'),
        ('7', 'clubs'),
        ('8', 'clubs'),
        ('9', 'clubs'),
        ('10', 'clubs'),
        ('11', 'clubs'),
        ('12', 'clubs'),
        ('13', 'clubs'),
        ('14', 'clubs'),
        ('2', 'spades'),
        ('3', 'spades'),
        ('4', 'spades'),
        ('5', 'spades'),
        ('6', 'spades'),
        ('7', 'spades'),
        ('8', 'spades'),
        ('9', 'spades'),
        ('10', 'spades'),
        ('11', 'spades'),
        ('12', 'spades'),
        ('13', 'spades'),
        ('14', 'spades');`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // deletes all cards
  pgm.sql(`DELETE FROM cards;`);
}
