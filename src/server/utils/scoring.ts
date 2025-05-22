export type Card = { value: number; shape: string };

export type ScoredHand = {
  rank: number; // 0–9, the higher is better
  tieBreakers: number[]; // highest value cards in case of multiple cards of the same value
};

// Get all 5-card combinations from 7 cards
export function getCombinations(cards: Card[], k = 5): Card[][] {
  const results: Card[][] = [];

  function combine(start: number, combo: Card[]) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < cards.length; i++) {
      combo.push(cards[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return results;
}

// All cards are the same shape
function isFlush(cards: Card[]): boolean {
  return cards.every((c) => c.shape === cards[0].shape);
}

// All cards go in sequence
function isStraight(values: number[]): number | null {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length < 5) return null;

  // Straight with an Ace high
  for (let i = 0; i <= sorted.length - 5; i++) {
    if (sorted[i + 4] - sorted[i] === 4) {
      return sorted[i + 4]; // high card of the straight
    }
  }

  // Straight with an Ace low
  if (
    JSON.stringify(sorted.slice(-4).concat(14)) ===
    JSON.stringify([2, 3, 4, 5, 14])
  ) {
    return 5;
  }

  // No Straight
  return null;
}

// Counts how many of a card value there are
function getCounts(values: number[]): Map<number, number> {
  const map = new Map<number, number>();
  values.forEach((v) => map.set(v, (map.get(v) || 0) + 1));
  return map;
}

// Assigns the hand one of 9 rankings
export function scoreHand(cards: Card[]): ScoredHand {
  const values = cards.map((c) => c.value).sort((a, b) => b - a);
  const flush = isFlush(cards);
  const straightHigh = isStraight(values);
  const counts = getCounts(values);
  const grouped = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || b[0] - a[0],
  ); // Creates an array of [value, count] to find pair, three or four of a kind

  // Royal Flush
  if (flush && straightHigh === 14) return { rank: 9, tieBreakers: [14] };

  // Straight Flush
  if (flush && straightHigh) return { rank: 8, tieBreakers: [straightHigh] };

  // Four of a Kind
  if (grouped[0][1] === 4)
    return { rank: 7, tieBreakers: [grouped[0][0], grouped[1][0]] };

  // Full House
  if (grouped[0][1] === 3 && grouped[1][1] >= 2)
    return { rank: 6, tieBreakers: [grouped[0][0], grouped[1][0]] };

  // Flush
  if (flush) return { rank: 5, tieBreakers: values };

  // Straight
  if (straightHigh) return { rank: 4, tieBreakers: [straightHigh] };

  // Three of a Kind
  if (grouped[0][1] === 3)
    return {
      rank: 3,
      tieBreakers: [grouped[0][0], grouped[1][0], grouped[2][0]],
    };

  // Two Pair
  if (grouped[0][1] === 2 && grouped[1][1] === 2)
    return {
      rank: 2,
      tieBreakers: [grouped[0][0], grouped[1][0], grouped[2][0]],
    };

  // One Pair
  if (grouped[0][1] === 2)
    return {
      rank: 1,
      tieBreakers: [
        grouped[0][0],
        ...values.filter((v) => v !== grouped[0][0]),
      ],
    };

  // High Card
  return { rank: 0, tieBreakers: values };
}

export function compareHands(a: ScoredHand, b: ScoredHand): number {
  if (a.rank !== b.rank) return a.rank - b.rank;
  for (let i = 0; i < a.tieBreakers.length; i++) {
    const diff = (a.tieBreakers[i] || 0) - (b.tieBreakers[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
