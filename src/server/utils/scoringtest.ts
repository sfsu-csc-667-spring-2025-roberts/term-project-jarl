import { scoreHand, compareHands, getCombinations } from "./scoring";

// Should be flush
const flushHand = [
  { value: 14, shape: "hearts" },
  { value: 13, shape: "hearts" },
  { value: 11, shape: "hearts" },
  { value: 9, shape: "hearts" },
  { value: 2, shape: "hearts" },
];

// Should be straight
const straightHand = [
  { value: 10, shape: "spades" },
  { value: 11, shape: "hearts" },
  { value: 12, shape: "clubs" },
  { value: 13, shape: "diamonds" },
  { value: 14, shape: "hearts" },
];

// should be fullhouse and win
const fullHouseHand = [
  { value: 10, shape: "spades" },
  { value: 10, shape: "hearts" },
  { value: 10, shape: "clubs" },
  { value: 4, shape: "hearts" },
  { value: 4, shape: "clubs" },
];

console.log("Flush:", scoreHand(flushHand));
console.log("Straight:", scoreHand(straightHand));
console.log("Full House:", scoreHand(fullHouseHand));

const fullSeven = [
  { value: 10, shape: "spades" },
  { value: 10, shape: "hearts" },
  { value: 10, shape: "clubs" },
  { value: 4, shape: "hearts" },
  { value: 4, shape: "clubs" },
  { value: 2, shape: "hearts" },
  { value: 9, shape: "hearts" },
];

const combos = getCombinations(fullSeven, 5);
const best = combos.map(scoreHand).sort((a, b) => compareHands(b, a))[0];

console.log("Best of 7 cards:", best);
