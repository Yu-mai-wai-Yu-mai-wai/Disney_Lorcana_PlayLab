import { describe, it, expect } from 'vitest';
import { shuffle } from '../utils/shuffle';

const countOrders = (runs: number) => {
  const counts = new Map<string, number>();
  for (let i = 0; i < runs; i++) {
    const key = shuffle([1, 2, 3, 4]).join('');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
};

describe('shuffle (Fisher-Yates)', () => {
  it('TC-SHUF-01: returns a permutation and leaves the input untouched', () => {
    const deck = Array.from({ length: 60 }, (_, i) => `card-${i}`);
    const before = [...deck];
    const out = shuffle(deck);
    expect(deck).toEqual(before);
    expect(out).not.toBe(deck);
    expect([...out].sort()).toEqual([...deck].sort());
  });

  it('TC-SHUF-02: every order of 4 cards comes up about equally often', () => {
    const runs = 48_000; // 24 orders -> 2,000 expected each
    const counts = countOrders(runs);
    expect(counts.size).toBe(24);
    for (const n of counts.values()) expect(Math.abs(n - runs / 24)).toBeLessThan(300); // ~7 standard deviations (sd ≈ 44)
  });
});
