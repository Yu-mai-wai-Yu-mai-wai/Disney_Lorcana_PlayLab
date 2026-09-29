import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCardAbilities } from '../src/game/abilities';
import type { LorcanaCard } from '../src/game/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface AbilityStat {
  totalCards: number;
  cardsWithAbilities: number;
  totalAbilities: number;
  supportLevel: {
    full: number;
    partial: number;
    manual: number;
  };
  timingBreakdown: Record<string, number>;
  setBreakdown: Record<
    string,
    {
      totalCards: number;
      totalAbilities: number;
      full: number;
      partial: number;
      manual: number;
    }
  >;
}

export function measureAbilityCoverage(jsonPath: string): AbilityStat {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const cards: LorcanaCard[] = JSON.parse(raw);

  const stats: AbilityStat = {
    totalCards: cards.length,
    cardsWithAbilities: 0,
    totalAbilities: 0,
    supportLevel: { full: 0, partial: 0, manual: 0 },
    timingBreakdown: {},
    setBreakdown: {},
  };

  for (const card of cards) {
    const setCode = card.setCode || 'Unknown';
    if (!stats.setBreakdown[setCode]) {
      stats.setBreakdown[setCode] = {
        totalCards: 0,
        totalAbilities: 0,
        full: 0,
        partial: 0,
        manual: 0,
      };
    }
    stats.setBreakdown[setCode].totalCards += 1;

    const abilities = parseCardAbilities(card);
    if (abilities.length > 0) {
      stats.cardsWithAbilities += 1;
      stats.totalAbilities += abilities.length;
      stats.setBreakdown[setCode].totalAbilities += abilities.length;

      for (const ab of abilities) {
        // Timing
        stats.timingBreakdown[ab.timing] = (stats.timingBreakdown[ab.timing] || 0) + 1;

        // Support Level
        stats.supportLevel[ab.supportLevel] += 1;
        stats.setBreakdown[setCode][ab.supportLevel] += 1;
      }
    }
  }

  return stats;
}

if (process.argv[1]?.includes('measure_ability_coverage')) {
  const datasetPath = path.resolve(__dirname, '../src/assets/lorcana_cards.json');
  const results = measureAbilityCoverage(datasetPath);

  const evidenceDir = path.resolve(__dirname, '../docs/01_Reports/stage3_evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const outPath = path.join(evidenceDir, 'ability_coverage.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

  console.log('=== Ability Coverage Report (T11) ===');
  console.log(`Total Cards: ${results.totalCards}`);
  console.log(`Cards with Abilities: ${results.cardsWithAbilities}`);
  console.log(`Total Abilities: ${results.totalAbilities}`);
  console.log(`Full Support: ${results.supportLevel.full} (${((results.supportLevel.full / results.totalAbilities) * 100).toFixed(1)}%)`);
  console.log(`Partial Support: ${results.supportLevel.partial} (${((results.supportLevel.partial / results.totalAbilities) * 100).toFixed(1)}%)`);
  console.log(`Manual Resolve: ${results.supportLevel.manual} (${((results.supportLevel.manual / results.totalAbilities) * 100).toFixed(1)}%)`);
  console.log(`Coverage Evidence saved to: ${outPath}`);
}
