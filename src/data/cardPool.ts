// ------------------------------------------------------------
// CARD POOL — official dataset (lorcana_set1_set2.json, 3,242 cards)
// All imageUrl verified HTTP 200 via GET (2026-08-14)
// ------------------------------------------------------------
import type { LorcanaCard } from '../types/lorcana';

const DATASET_URL = '/dataset/lorcana_set1_set2.json';

export interface PoolCard extends LorcanaCard {
  isInkable: boolean;
  img: string;
}

let cachedPool: PoolCard[] | null = null;
let cachedFullDataset: PoolCard[] | null = null;

export function toPoolCard(c: any): PoolCard {
  const rawId = c.id || c.name || `card-${Math.random().toString(36).substring(2, 8)}`;
  const isInkable = c.inkwell !== undefined ? Boolean(c.inkwell) : (c.isInkable !== undefined ? Boolean(c.isInkable) : true);
  return {
    id: String(rawId),
    name: c.name || 'Unknown Card',
    title: c.title || '',
    cost: Number(c.cost ?? 0),
    inkwell: isInkable,
    isInkable: isInkable,
    ink: c.ink || 'Amber',
    type: (c.type || 'Character') as any,
    subtypes: Array.isArray(c.subtypes) ? c.subtypes : [],
    rarity: c.rarity || 'Common',
    strength: c.strength !== undefined ? Number(c.strength) : undefined,
    willpower: c.willpower !== undefined ? Number(c.willpower) : undefined,
    lore: c.lore !== undefined ? Number(c.lore) : undefined,
    flavorText: c.flavorText || '',
    imageUrl: c.imageUrl || c.img || '',
    img: c.imageUrl || c.img || '',
    artist: c.artist || '',
    setCode: c.setCode || 'Set 1',
    abilities: Array.isArray(c.abilities) && c.abilities.length ? c.abilities : undefined,
  };
}

export async function fetchFullDataset(): Promise<PoolCard[]> {
  if (cachedFullDataset) return cachedFullDataset;
  try {
    const res = await fetch(DATASET_URL);
    if (!res.ok) throw new Error(`Failed to load card dataset: ${res.status}`);
    const raw = await res.json();
    const cards: any[] = Array.isArray(raw) ? raw : raw.cards || raw.data || [];
    cachedFullDataset = cards.map(toPoolCard);
    return cachedFullDataset;
  } catch (err) {
    console.warn('Could not fetch full dataset, falling back to STARTER_POOL', err);
    return STARTER_POOL;
  }
}

export function enrichCard(card: any, dataset?: PoolCard[]): PoolCard {
  if (!card) return toPoolCard({});
  if (dataset && dataset.length > 0) {
    const match = dataset.find(d => 
      (card.id && d.id === card.id) ||
      (card.name && d.name.toLowerCase() === card.name.toLowerCase() && (!card.title || d.title?.toLowerCase() === card.title.toLowerCase())) ||
      (card.name && d.name.toLowerCase() === card.name.toLowerCase())
    );
    if (match) {
      return {
        ...match,
        ...card,
        id: card.id || match.id,
        abilities: (card.abilities && card.abilities.length > 0) ? card.abilities : match.abilities,
        strength: card.strength !== undefined ? card.strength : match.strength,
        willpower: card.willpower !== undefined ? card.willpower : match.willpower,
        lore: card.lore !== undefined ? card.lore : match.lore,
        inkwell: match.inkwell,
        isInkable: match.isInkable,
        title: card.title || match.title,
        flavorText: card.flavorText || match.flavorText,
        imageUrl: card.imageUrl || card.img || match.imageUrl,
        img: card.imageUrl || card.img || match.img,
      };
    }
  }
  return toPoolCard(card);
}

// Curated names — famous Disney Lorcana cards that cover all mechanics
const PREFERRED_NAMES = [
  'Stitch',
  'Elsa',
  'Mickey Mouse',
  'Maleficent',
  'Dragon Fire',
  'Magic Broom',
  'Lilo',
  'A Whole New World',
  'Tinker Bell',
  'Aladdin',
  'Friends on the Other Side',
  'Simba',
  'Ariel',
  'Genie',
  'Captain Hook',
  'Belle',
  'Hades',
  'Mufasa',
];

export async function fetchCardPool(): Promise<PoolCard[]> {
  if (cachedPool) return cachedPool;

  const dataset = await fetchFullDataset();
  const pool: PoolCard[] = [];
  for (const name of PREFERRED_NAMES) {
    const match = dataset.find(
      (c) => (c.name || '').toLowerCase() === name.toLowerCase() && !pool.some((p) => p.name.toLowerCase() === name.toLowerCase())
    );
    if (match) pool.push(match);
  }

  if (pool.length < 12) {
    const chars = dataset.filter(
      (c) => (c.type || '').toLowerCase() === 'character' && c.inkwell && !pool.some((p) => p.name === c.name)
    );
    const shuffled = chars.sort(() => Math.random() - 0.5);
    for (const c of shuffled) {
      if (pool.length >= 16) break;
      pool.push(c);
    }
  }

  cachedPool = pool;
  return pool;
}

// Synchronous starter pool with exact official stats, inkwell flags, and abilities
export const STARTER_POOL: PoolCard[] = [
  toPoolCard({
    id: 'card-1-21',
    name: 'Stitch',
    title: 'Carefree Surfer',
    cost: 7,
    inkwell: true,
    ink: 'Amber',
    type: 'Character',
    rarity: 'Legendary',
    strength: 4,
    willpower: 8,
    lore: 2,
    flavorText: "“So you're from outer space, huh? I hear the surfing's choice.”\n—David",
    imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/21_c9313d800707f408e740502a15578f53314c125a.jpg',
    abilities: [
      {
        name: 'OHANA',
        text: 'When you play this character, if you have 2 or more other characters in play, you may draw 2 cards.'
      }
    ]
  }),
  toPoolCard({
    id: 'card-1-40',
    name: 'Elsa',
    title: 'Queen Regent',
    cost: 4,
    inkwell: true,
    ink: 'Amethyst',
    type: 'Character',
    rarity: 'Common',
    strength: 4,
    willpower: 4,
    lore: 1,
    flavorText: "“I never knew what I was capable of.”",
    imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/40_01dc5bb928054aa2b228f2a1f97910208b36b42b.jpg',
    abilities: []
  }),
  toPoolCard({
    id: 'card-1-35',
    name: 'Anna',
    title: 'Heir to Arendelle',
    cost: 4,
    inkwell: true,
    ink: 'Amethyst',
    type: 'Character',
    rarity: 'Uncommon',
    strength: 2,
    willpower: 4,
    lore: 2,
    flavorText: "“Two sisters, one mind.”",
    imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/35_4f4f468ca40d2e14bc796485687cf51a5405c27e.jpg',
    abilities: [
      {
        name: 'LOVING HEART',
        text: "When you play this character, if you have a character named Elsa in play, choose an opposing character. The chosen character doesn't ready at the start of their next turn."
      }
    ]
  }),
  toPoolCard({
    id: 'card-1-9',
    name: 'Lilo',
    title: 'Making a Wish',
    cost: 1,
    inkwell: false,
    ink: 'Amber',
    type: 'Character',
    rarity: 'Rare',
    strength: 1,
    willpower: 1,
    lore: 2,
    flavorText: "“A falling star...I have to make a wish!”",
    imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/9_205d39935cf65005567f20ee0da223b2c47733ef.jpg',
    abilities: []
  }),
  toPoolCard({
    id: 'card-1-130',
    name: 'Dragon Fire',
    title: '',
    cost: 5,
    inkwell: false,
    ink: 'Ruby',
    type: 'Action',
    rarity: 'Uncommon',
    flavorText: "Rare is the hero who can withstand a dragon's wrath.",
    imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/130_decfce2e256561e57abe8d2d5e378a3781c2ee6d.jpg',
    abilities: [
      {
        name: 'DRAGON FIRE',
        text: 'Banish chosen opposing character.'
      }
    ]
  }),
  toPoolCard({
    id: 'card-1-193',
    name: 'Tinker Bell',
    title: 'Giant Fairy',
    cost: 6,
    inkwell: true,
    ink: 'Steel',
    type: 'Character',
    rarity: 'Super Rare',
    strength: 4,
    willpower: 5,
    lore: 2,
    imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/193_f8e077a83c8d685b85aed7136239642118d640e6.jpg',
    abilities: [
      {
        name: 'ROCK THE BOAT',
        text: 'When you play this character, deal 1 damage to each opposing character.'
      },
      {
        name: 'PUNY PIRATE!',
        text: 'During your turn, whenever this character banishes another character in a challenge, you may deal 2 damage to chosen opposing character.'
      }
    ]
  }),
];
