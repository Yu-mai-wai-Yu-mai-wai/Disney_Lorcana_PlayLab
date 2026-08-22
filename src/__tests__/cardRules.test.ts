import { describe, it, expect } from 'vitest';
import { toPoolCard, enrichCard } from '../data/cardPool';
import { RECOMMENDED_DECKS } from '../data/recommendedDecks';
import { LorcanaCard } from '../types/lorcana';

describe('Card Rules & Dataset QA Suite', () => {
  describe('1. Card Pool Mapping & Invariant Tests', () => {
    it('TC-CARD-01: toPoolCard should sanitize and map raw JSON correctly', () => {
      const raw = {
        id: 'set1-001',
        name: 'Mickey Mouse - Wayward Sorcerer',
        title: 'Wayward Sorcerer',
        cost: 4,
        inkwell: true,
        ink: 'Amethyst',
        type: 'Character',
        rarity: 'Super Rare',
        strength: 3,
        willpower: 4,
        lore: 2,
        imageUrl: 'https://images.lorcana.test/mickey.jpg',
      };

      const card = toPoolCard(raw);
      expect(card.id).toBe('set1-001');
      expect(card.name).toBe('Mickey Mouse - Wayward Sorcerer');
      expect(card.cost).toBe(4);
      expect(card.isInkable).toBe(true);
      expect(card.ink).toBe('Amethyst');
      expect(card.type).toBe('Character');
      expect(card.lore).toBe(2);
      expect(card.img).toBe('https://images.lorcana.test/mickey.jpg');
    });

    it('TC-CARD-02: toPoolCard should handle non-inkable card flag properly', () => {
      const raw = {
        id: 'set1-140',
        name: 'Elsa - Spirit of Winter',
        cost: 8,
        inkwell: false,
        ink: 'Amethyst',
      };

      const card = toPoolCard(raw);
      expect(card.isInkable).toBe(false);
      expect(card.inkwell).toBe(false);
    });

    it('TC-CARD-03: enrichCard should fallback gracefully on empty/invalid inputs', () => {
      const fallback = enrichCard(null);
      expect(fallback.name).toBe('Unknown Card');
      expect(fallback.cost).toBe(0);
    });
  });

  describe('2. Recommended Starter & Meta Decks Verification', () => {
    it('TC-CARD-04: all recommended decks must contain at least 60 cards', () => {
      RECOMMENDED_DECKS.forEach((deck) => {
        const total = deck.cards.reduce((sum, c) => sum + c.count, 0);
        expect(total).toBeGreaterThanOrEqual(60);
      });
    });

    it('TC-CARD-05: all recommended decks must have at most 2 ink colors', () => {
      RECOMMENDED_DECKS.forEach((deck) => {
        expect(deck.inkColors.length).toBeGreaterThanOrEqual(1);
        expect(deck.inkColors.length).toBeLessThanOrEqual(2);
      });
    });

    it('TC-CARD-06: no card in any recommended deck should exceed 4 copies', () => {
      RECOMMENDED_DECKS.forEach((deck) => {
        deck.cards.forEach((c) => {
          expect(c.count).toBeLessThanOrEqual(4);
          expect(c.count).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('3. Deck Legality & Synergy Computation Rules', () => {
    const validateDeckRules = (cards: { card: LorcanaCard; count: number }[]) => {
      const totalCount = cards.reduce((sum, c) => sum + c.count, 0);
      const inks = new Set(cards.map((c) => c.card.ink));
      const hasOver4Copies = cards.some((c) => c.count > 4);

      return {
        isValid: totalCount >= 60 && inks.size <= 2 && !hasOver4Copies,
        totalCount,
        inkCount: inks.size,
        hasOver4Copies,
      };
    };

    it('TC-CARD-07: validateDeckRules should reject deck with fewer than 60 cards', () => {
      const sampleCards = [
        {
          card: { id: 'c1', name: 'Card 1', cost: 1, ink: 'Amber', type: 'Character' } as LorcanaCard,
          count: 4,
        },
      ];
      const result = validateDeckRules(sampleCards);
      expect(result.isValid).toBe(false);
      expect(result.totalCount).toBe(4);
    });

    it('TC-CARD-08: validateDeckRules should reject deck with more than 2 ink colors', () => {
      const sampleCards = [
        { card: { id: 'c1', name: 'C1', cost: 1, ink: 'Amber', type: 'Character' } as LorcanaCard, count: 20 },
        { card: { id: 'c2', name: 'C2', cost: 2, ink: 'Ruby', type: 'Character' } as LorcanaCard, count: 20 },
        { card: { id: 'c3', name: 'C3', cost: 3, ink: 'Sapphire', type: 'Character' } as LorcanaCard, count: 20 },
      ];
      const result = validateDeckRules(sampleCards);
      expect(result.isValid).toBe(false);
      expect(result.inkCount).toBe(3);
    });
  });
});
