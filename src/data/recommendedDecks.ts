export interface RecommendedDeck {
  id: string;
  name: string;
  description: string;
  inkColors: string[];
  archetype: string;
  cards: { cardId: string; count: number }[];
}

export const RECOMMENDED_DECKS: RecommendedDeck[] = [
  {
    id: 'deck-ruby-amethyst-control',
    name: 'Ruby/Amethyst Control',
    description: 'Control the board with removal and powerful late-game characters.',
    inkColors: ['Ruby', 'Amethyst'],
    archetype: 'Control',
    cards: [
      { cardId: 'card-1-128', count: 4 }, // Be Prepared
      { cardId: 'card-1-130', count: 4 }, // Dragon Fire
      { cardId: 'card-1-40', count: 4 }, // Elsa Queen Regent
      { cardId: 'card-1-48', count: 4 }, // Maleficent Biding Her Time
      { cardId: 'card-1-57', count: 3 }, // The Wardrobe
      { cardId: 'card-1-58', count: 4 }, // Tinker Bell
      // Fill to 60 cards using some valid Ruby/Amethyst IDs
      { cardId: 'card-1-105', count: 4 }, 
      { cardId: 'card-1-106', count: 4 },
      { cardId: 'card-1-110', count: 4 },
      { cardId: 'card-1-42', count: 4 },
      { cardId: 'card-1-45', count: 4 },
      { cardId: 'card-1-50', count: 4 },
      { cardId: 'card-1-55', count: 4 },
      { cardId: 'card-1-60', count: 4 },
      { cardId: 'card-1-115', count: 4 },
      { cardId: 'card-1-120', count: 1 }
    ]
  },
  {
    id: 'deck-amber-steel-aggro',
    name: 'Amber/Steel Aggro Songs',
    description: 'Fast-paced deck utilizing songs and strong early characters.',
    inkColors: ['Amber', 'Steel'],
    archetype: 'Aggro',
    cards: [
      { cardId: 'card-1-1', count: 4 }, // Ariel On Human Legs
      { cardId: 'card-1-3', count: 4 }, // Cinderella Gentle and Kind
      { cardId: 'card-1-4', count: 4 }, // Goofy Musketeer
      { cardId: 'card-1-12', count: 4 }, // Mickey True Friend
      { cardId: 'card-1-18', count: 4 }, // Rapunzel
      { cardId: 'card-1-20', count: 4 }, // Simba Protective Cub
      { cardId: 'card-1-21', count: 4 }, // Stitch Carefree Surfer
      // Fill to 60 cards
      { cardId: 'card-1-175', count: 4 },
      { cardId: 'card-1-176', count: 4 },
      { cardId: 'card-1-180', count: 4 },
      { cardId: 'card-1-185', count: 4 },
      { cardId: 'card-1-190', count: 4 },
      { cardId: 'card-1-195', count: 4 },
      { cardId: 'card-1-15', count: 4 },
      { cardId: 'card-1-16', count: 4 }
    ]
  },
  {
    id: 'deck-sapphire-steel-ramp',
    name: 'Sapphire/Steel Ramp',
    description: 'Ramp your ink quickly to play large threats.',
    inkColors: ['Sapphire', 'Steel'],
    archetype: 'Ramp',
    cards: [
      { cardId: 'card-2-385', count: 4 }, // Pawpsicle
      { cardId: 'card-1-152', count: 4 }, // Maurice
      { cardId: 'card-1-155', count: 4 }, // Mufasa
      // Fill to 60 cards
      { cardId: 'card-1-140', count: 4 },
      { cardId: 'card-1-142', count: 4 },
      { cardId: 'card-1-145', count: 4 },
      { cardId: 'card-1-148', count: 4 },
      { cardId: 'card-1-160', count: 4 },
      { cardId: 'card-1-165', count: 4 },
      { cardId: 'card-1-172', count: 4 },
      { cardId: 'card-1-178', count: 4 },
      { cardId: 'card-1-182', count: 4 },
      { cardId: 'card-1-188', count: 4 },
      { cardId: 'card-1-192', count: 4 },
      { cardId: 'card-1-198', count: 4 }
    ]
  }
];
