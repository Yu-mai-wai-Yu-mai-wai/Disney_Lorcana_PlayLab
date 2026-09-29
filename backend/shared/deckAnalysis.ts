// Single source of truth for deck analysis. Imported by backend/server.ts (EC2),
// backend/serverless/analyzer (Lambda) and src/components/AnalyticsDashboard.tsx.
// Pure: no I/O, no Date.now() (the clock is injected), so it runs in Node, Lambda and the browser.

export interface DeckAnalysis {
  totalCards: number;
  costCurve: Record<'0-2' | '3-4' | '5-6' | '7+', number>;
  inkDistribution: Record<string, number>;
  characterRatio: number;
  avgCost: number;
  synergyScore: number;
  summaryText: string;
  analyzedAt: string;
  // added for the Analytics page
  costHistogram: number[]; // index 0..9 = that cost, index 10 = 10+
  characterHistogram: number[]; // same shape, characters only
  inkableCount: number;
  nonInkableCount: number;
  inkableRatio: number;
  typeCounts: { Character: number; Action: number; Item: number; Location: number };
  loreTotal: number; // sum of lore x count over Characters
}

const round2 = (n: number) => Number(n.toFixed(2));

export function analyzeDeck(cards: any[], now: Date = new Date()): DeckAnalysis {
  let totalCards = 0;
  let totalCost = 0;
  let cardsWithCost = 0;
  let inkable = 0;
  let loreTotal = 0;

  const costCurve = { '0-2': 0, '3-4': 0, '5-6': 0, '7+': 0 };
  const costHistogram = Array(11).fill(0) as number[];
  const characterHistogram = Array(11).fill(0) as number[];
  const inkDistribution: Record<string, number> = {};
  const typeCounts = { Character: 0, Action: 0, Item: 0, Location: 0 };

  for (const item of cards) {
    const c = item.card || item;
    const count = Number(item.count) || 1;
    totalCards += count;

    if (c.cost !== undefined) {
      const cost = Number(c.cost);
      const slot = Math.min(Math.max(Math.trunc(cost), 0), 10);
      totalCost += cost * count;
      cardsWithCost += count;
      costHistogram[slot] += count;
      if (c.type === 'Character') characterHistogram[slot] += count;
      if (cost <= 2) costCurve['0-2'] += count;
      else if (cost <= 4) costCurve['3-4'] += count;
      else if (cost <= 6) costCurve['5-6'] += count;
      else costCurve['7+'] += count;
    }

    if (c.ink) inkDistribution[c.ink] = (inkDistribution[c.ink] || 0) + count;
    if (c.inkwell) inkable += count;
    if (c.type in typeCounts) typeCounts[c.type as keyof typeof typeCounts] += count;
    if (c.type === 'Character') loreTotal += (Number(c.lore) || 0) * count;
  }

  const avgCost = cardsWithCost > 0 ? round2(totalCost / cardsWithCost) : 0;
  const characterRatio = totalCards > 0 ? round2(typeCounts.Character / totalCards) : 0;

  let synergyScore = 100;
  const numInks = Object.keys(inkDistribution).length;
  if (numInks === 0) synergyScore -= 50;
  if (numInks > 2) synergyScore -= 30;
  if (characterRatio < 0.6) synergyScore -= 20;
  else if (characterRatio > 0.8) synergyScore -= 10;
  if (costCurve['0-2'] < 10) synergyScore -= 15;
  if (costCurve['3-4'] < 10) synergyScore -= 15;
  synergyScore = Math.max(0, Math.min(100, synergyScore));

  let summaryText = 'เด็คสมดุลดี พร้อมลุย';
  if (synergyScore < 50) summaryText = 'เด็คอาจต้องปรับปรุงสมดุลของการ์ดหรือการใช้หมึก';
  else if (synergyScore < 80) summaryText = 'เด็คค่อนข้างดี แต่อาจเพิ่มการ์ดตัวละครหรือปรับ Cost Curve';

  return {
    totalCards,
    costCurve,
    inkDistribution,
    characterRatio,
    avgCost,
    synergyScore,
    summaryText,
    analyzedAt: now.toISOString(),
    costHistogram,
    characterHistogram,
    inkableCount: inkable,
    nonInkableCount: totalCards - inkable,
    inkableRatio: totalCards > 0 ? round2(inkable / totalCards) : 0,
    typeCounts,
    loreTotal,
  };
}
