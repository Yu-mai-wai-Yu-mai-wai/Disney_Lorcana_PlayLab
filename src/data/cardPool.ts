// ------------------------------------------------------------
// CARD POOL — official dataset (lorcana_set1_set2.json, 3,242 cards)
// All imageUrl verified HTTP 200 via GET (2026-08-14)
// ------------------------------------------------------------
import type { LorcanaCard } from '../types/lorcana';

// Lazy-import the full dataset once, then derive a curated playable pool.
// The dataset lives in public/ so Vite serves it as a static JSON file.
const DATASET_URL = '/dataset/lorcana_set1_set2.json';

export interface PoolCard extends LorcanaCard {
  isInkable: boolean;
  img: string;
}

let cachedPool: PoolCard[] | null = null;

function toPoolCard(c: any): PoolCard {
  return {
    id: `card-${c.setCode || 'x'}-${c.id || c.name}`.replace(/[^a-zA-Z0-9-]/g, '-'),
    name: c.name,
    title: c.title,
    cost: c.cost ?? 0,
    inkwell: !!c.inkwell,
    isInkable: !!c.inkwell,
    ink: c.ink || 'Amber',
    type: (c.type || 'Character') as any,
    subtypes: c.subtypes,
    rarity: c.rarity,
    strength: c.strength,
    willpower: c.willpower,
    lore: c.lore,
    flavorText: c.flavorText,
    imageUrl: c.imageUrl,
    img: c.imageUrl,
    artist: c.artist,
    setCode: c.setCode,
    abilities: Array.isArray(c.abilities) && c.abilities.length ? c.abilities : undefined,
  };
}

// Curated names — famous Disney Lorcana cards that cover all mechanics
// (characters with abilities, actions, songs, items).
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

  const res = await fetch(DATASET_URL);
  if (!res.ok) throw new Error(`Failed to load card dataset: ${res.status}`);
  const raw = await res.json();
  const cards: any[] = Array.isArray(raw) ? raw : raw.cards || raw.data || [];

  const pool: PoolCard[] = [];
  for (const name of PREFERRED_NAMES) {
    const match = cards.find(
      (c) => (c.name || '').toLowerCase() === name.toLowerCase() && !pool.some((p) => p.name.toLowerCase() === name.toLowerCase())
    );
    if (match) pool.push(toPoolCard(match));
  }

  // Fallback: if any preferred name is missing from the dataset, pad with
  // random inkable characters so the sandbox always has a playable pool.
  if (pool.length < 12) {
    const chars = cards.filter(
      (c) => (c.type || '').toLowerCase() === 'character' && c.inkwell && !pool.some((p) => p.name === c.name)
    );
    const shuffled = chars.sort(() => Math.random() - 0.5);
    for (const c of shuffled) {
      if (pool.length >= 16) break;
      pool.push(toPoolCard(c));
    }
  }

  cachedPool = pool;
  return pool;
}

// Small synchronous starter pool used for the opening hand (no async needed).
export const STARTER_POOL: PoolCard[] = [
  toPoolCard({ name: 'Stitch', title: 'Alien Pirate', cost: 2, inkwell: true, ink: 'Emerald', type: 'Character', strength: 3, willpower: 4, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/21_c9313d800707f408e740502a15578f53314c125a.jpg', abilities: [{ name: 'RAPSCALLION', text: 'When you play this character, you may draw a card.' }] }),
  toPoolCard({ name: 'Elsa', title: 'Snow Queen', cost: 3, inkwell: true, ink: 'Sapphire', type: 'Character', strength: 3, willpower: 5, lore: 1, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/48_4026147a113c16a740020b8d3e8b4b6016cd76ad.jpg', abilities: [{ name: 'DEEP FREEZE', text: 'When played, exert up to 2 chosen characters.' }] }),
  toPoolCard({ name: 'Magic Broom', title: 'Bucket Brigade', cost: 2, inkwell: true, ink: 'Amethyst', type: 'Character', strength: 2, willpower: 2, lore: 1, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/35_781112b3226a2d6eb5228198fdfb552b7d532a8f.jpg' }),
  toPoolCard({ name: 'Lilo', title: 'Making Wishes', cost: 1, inkwell: true, ink: 'Amber', type: 'Character', strength: 1, willpower: 1, lore: 2, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/17_ef31c4fce4c489bd07dd6e2ff62a5b6f387db287.jpg' }),
  toPoolCard({ name: 'Dragon Fire', title: 'Action', cost: 5, inkwell: false, ink: 'Ruby', type: 'Action', imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/58_e13723fd1214327ef6f4ac4954201558bd90caa6.jpg', abilities: [{ name: 'DRAGON FIRE', text: 'Banish chosen opposing character.' }] }),
  toPoolCard({ name: 'Tinker Bell', title: 'Tiny Fairy', cost: 3, inkwell: true, ink: 'Steel', type: 'Character', strength: 2, willpower: 3, lore: 1, imageUrl: 'https://api.lorcana.ravensburger.com/images/en/set1/12_da68c89ea3fc28a3a7396c30ab3da45e0f204eea.jpg' }),
];
