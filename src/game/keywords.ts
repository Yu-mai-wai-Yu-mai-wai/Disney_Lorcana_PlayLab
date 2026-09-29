import type { LorcanaCard } from './types';

export interface CardKeywords {
  alert: boolean;
  bodyguard: boolean;
  boost: number;
  challenger: number;
  evasive: boolean;
  reckless: boolean;
  resist: number;
  rush: boolean;
  shift?: { cost: number; variant?: string };
  singer?: number;
  singTogether?: number;
  support: boolean;
  vanish: boolean;
  ward: boolean;
}

/**
 * Extracts and parses all 14 official Lorcana keywords from a card's abilities and rules text.
 * Strictly uses word boundaries (\b) to prevent false-positive matches on substrings (e.g. "reward", "awkward").
 */
export function parseCardKeywords(card: LorcanaCard): CardKeywords {
  if (!card) {
    return {
      alert: false,
      bodyguard: false,
      boost: 0,
      challenger: 0,
      evasive: false,
      reckless: false,
      resist: 0,
      rush: false,
      support: false,
      vanish: false,
      ward: false,
    };
  }

  const abilityStrings: string[] = [];
  if (card.abilities && Array.isArray(card.abilities)) {
    for (const ab of card.abilities) {
      const name = (ab.name || '').trim();
      const text = (ab.text || '').trim();
      if (name && text && text.toLowerCase().startsWith(name.toLowerCase())) {
        abilityStrings.push(text);
      } else {
        abilityStrings.push([name, text].filter(Boolean).join(' '));
      }
    }
  }

  const fullText = abilityStrings.join('\n');

  // 1. Alert
  const alert = /\balert\b/i.test(fullText);

  // 2. Bodyguard
  const bodyguard = /\bbodyguard\b/i.test(fullText);

  // 3. Boost N
  let boost = 0;
  const boostMatch = fullText.match(/\bboost\s+(\d+)\b/i);
  if (boostMatch) {
    boost = parseInt(boostMatch[1], 10);
  }

  // 4. Challenger +N (stacks)
  let challenger = 0;
  const challengerMatches = fullText.matchAll(/\bchallenger\s*\+(\d+)\b/gi);
  for (const m of challengerMatches) {
    challenger += parseInt(m[1], 10);
  }

  // 5. Evasive
  const evasive = /\bevasive\b/i.test(fullText);

  // 6. Reckless
  const reckless = /\breckless\b/i.test(fullText);

  // 7. Resist +N (stacks)
  let resist = 0;
  const resistMatches = fullText.matchAll(/\bresist\s*\+(\d+)\b/gi);
  for (const m of resistMatches) {
    resist += parseInt(m[1], 10);
  }

  // 8. Rush
  const rush = /\brush\b/i.test(fullText);

  // 9. Shift N
  let shift: { cost: number; variant?: string } | undefined = undefined;
  const shiftMatch = fullText.match(/\b(universal|duo|combo|temporary|potato)?\s*shift\s+(\d+)\b/i);
  if (shiftMatch) {
    shift = {
      cost: parseInt(shiftMatch[2], 10),
      variant: shiftMatch[1] ? shiftMatch[1].toLowerCase() : undefined,
    };
  }

  // 10. Singer N
  let singer: number | undefined = undefined;
  const singerMatch = fullText.match(/\bsinger\s+(\d+)\b/i);
  if (singerMatch) {
    singer = parseInt(singerMatch[1], 10);
  }

  // 11. Sing Together N
  let singTogether: number | undefined = undefined;
  const singTogetherMatch = fullText.match(/\bsing\s+together\s+(\d+)\b/i);
  if (singTogetherMatch) {
    singTogether = parseInt(singTogetherMatch[1], 10);
  }

  // 12. Support
  const support = /\bsupport\b/i.test(fullText);

  // 13. Vanish
  const vanish = /\bvanish\b/i.test(fullText);

  // 14. Ward (\bward\b ensures words like "reward", "awkward", "coward", "forward" are NOT matched)
  const ward = /\bward\b/i.test(fullText);

  return {
    alert,
    bodyguard,
    boost,
    challenger,
    evasive,
    reckless,
    resist,
    rush,
    shift,
    singer,
    singTogether,
    support,
    vanish,
    ward,
  };
}

/**
 * Calculates effective strength of a card considering Challenger +N while attacking.
 */
export function getEffectiveStrength(card: LorcanaCard, isChallenging = false): number {
  const base = card.strength || 0;
  if (!isChallenging) return base;
  const kw = parseCardKeywords(card);
  return base + kw.challenger;
}

/**
 * Calculates effective damage after applying Resist +N.
 */
export function getEffectiveDamage(incomingDamage: number, resistValue: number): number {
  return Math.max(0, incomingDamage - Math.max(0, resistValue));
}
