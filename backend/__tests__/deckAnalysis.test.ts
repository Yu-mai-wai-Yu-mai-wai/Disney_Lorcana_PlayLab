import { describe, it, expect } from 'vitest';
import { analyzeDeck } from '../shared/deckAnalysis';

// Deck with hand-computed answers (12 cards)
const DECK = [
  { card: { id: 'a', cost: 1, inkwell: true, ink: 'Amber', type: 'Character', lore: 1 }, count: 4 },
  { card: { id: 'b', cost: 3, inkwell: true, ink: 'Amber', type: 'Character', lore: 2 }, count: 4 },
  { card: { id: 'c', cost: 5, inkwell: false, ink: 'Steel', type: 'Action', lore: 0 }, count: 2 },
  { card: { id: 'd', cost: 11, inkwell: true, ink: 'Steel', type: 'Item' }, count: 1 },
  { card: { id: 'e', cost: 2, inkwell: false, ink: 'Steel', type: 'Location', lore: 1 }, count: 1 },
];
const NOW = new Date('2026-09-29T00:00:00.000Z');

describe('analyzeDeck (TC-DECK-001..)', () => {
  const r = analyzeDeck(DECK, NOW);

  it('TC-DECK-001 totals, average cost and legacy 4-bucket curve stay unchanged', () => {
    expect(r.totalCards).toBe(12);
    expect(r.avgCost).toBe(3.25);
    expect(r.costCurve).toEqual({ '0-2': 5, '3-4': 4, '5-6': 2, '7+': 1 });
    expect(r.inkDistribution).toEqual({ Amber: 8, Steel: 4 });
    expect(r.characterRatio).toBe(0.67);
  });

  it('TC-DECK-002 per-cost histogram 0..9 plus 10+, split characters vs others', () => {
    expect(r.costHistogram).toHaveLength(11);
    expect(r.costHistogram[1]).toBe(4);
    expect(r.costHistogram[2]).toBe(1);
    expect(r.costHistogram[3]).toBe(4);
    expect(r.costHistogram[5]).toBe(2);
    expect(r.costHistogram[10]).toBe(1); // cost 11 lands in the 10+ bucket
    expect(r.characterHistogram).toHaveLength(11);
    expect(r.characterHistogram[1]).toBe(4);
    expect(r.characterHistogram[2]).toBe(0);
    expect(r.characterHistogram[3]).toBe(4);
  });

  it('TC-DECK-003 inkable ratio and counts', () => {
    expect(r.inkableCount).toBe(9);
    expect(r.nonInkableCount).toBe(3);
    expect(r.inkableRatio).toBe(0.75);
  });

  it('TC-DECK-004 type counts and character lore total', () => {
    expect(r.typeCounts).toEqual({ Character: 8, Action: 2, Item: 1, Location: 1 });
    expect(r.loreTotal).toBe(12); // 4x1 + 4x2, characters only
  });

  it('TC-DECK-005 synergy score and summary (2 inks ok, -15 early curve, -15 mid curve)', () => {
    expect(r.synergyScore).toBe(70);
    expect(r.summaryText).toBe('เด็คค่อนข้างดี แต่อาจเพิ่มการ์ดตัวละครหรือปรับ Cost Curve');
  });

  it('TC-DECK-006 analyzedAt comes from the injected clock (function is pure)', () => {
    expect(r.analyzedAt).toBe('2026-09-29T00:00:00.000Z');
    expect(analyzeDeck(DECK, NOW)).toEqual(r);
  });

  it('TC-DECK-007 accepts flat card objects and string counts, ignores cards without cost', () => {
    const flat = analyzeDeck([{ cost: 2, ink: 'Ruby', type: 'Character', inkwell: true }, { ink: 'Ruby', type: 'Action' }], NOW);
    expect(flat.totalCards).toBe(2);
    expect(flat.avgCost).toBe(2);
    const str = analyzeDeck([{ card: { cost: 4, ink: 'Ruby', type: 'Character' }, count: '3' as any }], NOW);
    expect(str.totalCards).toBe(3);
  });

  it('TC-DECK-008 empty deck gives zeros, no NaN', () => {
    const e = analyzeDeck([], NOW);
    expect(e.totalCards).toBe(0);
    expect(e.avgCost).toBe(0);
    expect(e.inkableRatio).toBe(0);
    expect(e.characterRatio).toBe(0);
    expect(e.loreTotal).toBe(0);
    expect(JSON.stringify(e)).not.toContain('null');
  });
});
