import type { LorcanaCard } from './types';
import { parseCardKeywords } from './keywords';

export type AbilityTiming =
  | 'on_play'
  | 'on_quest'
  | 'on_banish'
  | 'on_challenge'
  | 'turn_start'
  | 'turn_end'
  | 'activated'
  | 'static'
  | 'manual';

export type EffectType =
  | 'draw'
  | 'gain_lore'
  | 'lose_lore'
  | 'banish_chosen'
  | 'deal_damage'
  | 'remove_damage'
  | 'exert_chosen'
  | 'ready_chosen'
  | 'return_to_hand'
  | 'buff_strength'
  | 'manual';

export interface AbilityEffect {
  type: EffectType;
  amount?: number;
  needsTarget: boolean;
  targetScope?: 'all' | 'opposing' | 'friendly';
  targetType?: 'character' | 'item' | 'location';
  maxStrength?: number;
  maxCost?: number;
}

export interface ParsedAbility {
  name: string;
  rawText: string;
  timing: AbilityTiming;
  effect: AbilityEffect;
  supportLevel: 'full' | 'partial' | 'manual';
}

/**
 * Parses an ability's timing and effect mechanics from its name and rule text.
 */
export function parseAbility(name: string, rawText: string): ParsedAbility {
  const text = (rawText || '').trim();
  const lower = text.toLowerCase();

  // 1. Determine Trigger Timing
  let timing: AbilityTiming = 'manual';

  if (/when you play this|when played/i.test(lower)) {
    timing = 'on_play';
  } else if (/whenever this character quests|when this character quests/i.test(lower)) {
    timing = 'on_quest';
  } else if (/when this character is banished/i.test(lower)) {
    timing = 'on_banish';
  } else if (/whenever this character challenges|when challenging/i.test(lower)) {
    timing = 'on_challenge';
  } else if (/at the start of your turn|at the beginning of your turn/i.test(lower)) {
    timing = 'turn_start';
  } else if (/at the end of your turn/i.test(lower)) {
    timing = 'turn_end';
  } else if (/⟳|exert.*—|pay \d+ ink.*—/i.test(lower)) {
    timing = 'activated';
  } else if (/your other characters|opposing characters with/i.test(lower)) {
    timing = 'static';
  }

  // 2. Parse Supported Effect
  let effect: AbilityEffect = {
    type: 'manual',
    needsTarget: false,
  };
  let supportLevel: 'full' | 'partial' | 'manual' = 'manual';

  // Draw card
  const drawMatch = lower.match(/draw (\d+) cards?/);
  if (drawMatch) {
    effect = { type: 'draw', amount: parseInt(drawMatch[1], 10), needsTarget: false };
    supportLevel = timing !== 'manual' ? 'full' : 'partial';
  } else if (/draw a card/i.test(lower)) {
    effect = { type: 'draw', amount: 1, needsTarget: false };
    supportLevel = timing !== 'manual' ? 'full' : 'partial';
  }
  // Gain Lore
  else if (/gain (\d+) lore/i.test(lower)) {
    const m = lower.match(/gain (\d+) lore/i);
    effect = { type: 'gain_lore', amount: m ? parseInt(m[1], 10) : 1, needsTarget: false };
    supportLevel = timing !== 'manual' ? 'full' : 'partial';
  }
  // Lose Lore
  else if (/opponent loses (\d+) lore|lose (\d+) lore/i.test(lower)) {
    const m = lower.match(/loses? (\d+) lore/i);
    effect = { type: 'lose_lore', amount: m ? parseInt(m[1], 10) : 1, needsTarget: false };
    supportLevel = timing !== 'manual' ? 'full' : 'partial';
  }
  // Banish chosen character
  else if (/banish chosen/i.test(lower)) {
    const maxStrMatch = lower.match(/with (\d+)\s*¤\s*or less/i) || lower.match(/with (\d+)\s*strength or less/i);
    const maxCostMatch = lower.match(/with cost (\d+) or less/i);
    effect = {
      type: 'banish_chosen',
      needsTarget: true,
      targetScope: /opposing/i.test(lower) ? 'opposing' : 'all',
      targetType: 'character',
      maxStrength: maxStrMatch ? parseInt(maxStrMatch[1], 10) : undefined,
      maxCost: maxCostMatch ? parseInt(maxCostMatch[1], 10) : undefined,
    };
    supportLevel = 'full';
  }
  // Deal damage chosen
  else if (/deal (\d+) damage to chosen/i.test(lower)) {
    const m = lower.match(/deal (\d+) damage to chosen/i);
    effect = {
      type: 'deal_damage',
      amount: m ? parseInt(m[1], 10) : 1,
      needsTarget: true,
      targetScope: /opposing/i.test(lower) ? 'opposing' : 'all',
      targetType: 'character',
    };
    supportLevel = 'full';
  }
  // Remove damage chosen
  else if (/remove up to (\d+) damage from chosen/i.test(lower)) {
    const m = lower.match(/remove up to (\d+) damage from chosen/i);
    effect = {
      type: 'remove_damage',
      amount: m ? parseInt(m[1], 10) : 1,
      needsTarget: true,
      targetScope: 'all',
      targetType: 'character',
    };
    supportLevel = 'full';
  }
  // Exert chosen
  else if (/exert chosen/i.test(lower)) {
    effect = {
      type: 'exert_chosen',
      needsTarget: true,
      targetScope: /opposing/i.test(lower) ? 'opposing' : 'all',
      targetType: 'character',
    };
    supportLevel = 'full';
  }
  // Ready chosen
  else if (/ready chosen/i.test(lower)) {
    effect = {
      type: 'ready_chosen',
      needsTarget: true,
      targetScope: 'all',
      targetType: 'character',
    };
    supportLevel = 'full';
  }
  // Return to hand
  else if (/return chosen .* to .* hand/i.test(lower)) {
    effect = {
      type: 'return_to_hand',
      needsTarget: true,
      targetScope: 'all',
      targetType: 'character',
    };
    supportLevel = 'full';
  }
  // Buff strength
  else if (/\+(\d+)\s*¤\s*this turn/i.test(lower) || /gets \+(\d+)\s*¤/i.test(lower)) {
    const m = lower.match(/\+(\d+)\s*¤/i);
    effect = {
      type: 'buff_strength',
      amount: m ? parseInt(m[1], 10) : 1,
      needsTarget: /chosen/i.test(lower),
      targetScope: 'friendly',
      targetType: 'character',
    };
    supportLevel = 'full';
  }

  return {
    name,
    rawText,
    timing,
    effect,
    supportLevel,
  };
}

/**
 * Parses all abilities of a given card.
 */
export function parseCardAbilities(card: LorcanaCard): ParsedAbility[] {
  if (!card.abilities || !Array.isArray(card.abilities)) return [];
  return card.abilities.map((ab) => parseAbility(ab.name, ab.text));
}
