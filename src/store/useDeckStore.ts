import { create } from 'zustand';
import { LorcanaCard, InkColor } from '../types/lorcana';

interface DeckState {
  currentDeck: { card: LorcanaCard; count: number }[];
  deckName: string;
  selectedInkFilter: InkColor | 'All';
  searchQuery: string;
  setDeckName: (name: string) => void;
  addCard: (card: LorcanaCard) => void;
  removeCard: (cardId: string) => void;
  clearDeck: () => void;
  setInkFilter: (ink: InkColor | 'All') => void;
  setSearchQuery: (query: string) => void;
  getTotalCards: () => number;
}

export const useDeckStore = create<DeckState>((set, get) => ({
  currentDeck: [],
  deckName: 'My Magical Deck',
  selectedInkFilter: 'All',
  searchQuery: '',

  setDeckName: (name: string) => set({ deckName: name }),

  addCard: (card: LorcanaCard) => {
    const deck = get().currentDeck;
    const existing = deck.find((item) => item.card.id === card.id);

    if (existing) {
      if (existing.count >= 4) return; // Lorcana 4-copy rule limit
      set({
        currentDeck: deck.map((item) =>
          item.card.id === card.id ? { ...item, count: item.count + 1 } : item
        ),
      });
    } else {
      set({ currentDeck: [...deck, { card, count: 1 }] });
    }
  },

  removeCard: (cardId: string) => {
    const deck = get().currentDeck;
    const existing = deck.find((item) => item.card.id === cardId);

    if (!existing) return;

    if (existing.count > 1) {
      set({
        currentDeck: deck.map((item) =>
          item.card.id === cardId ? { ...item, count: item.count - 1 } : item
        ),
      });
    } else {
      set({
        currentDeck: deck.filter((item) => item.card.id !== cardId),
      });
    }
  },

  clearDeck: () => set({ currentDeck: [] }),

  setInkFilter: (ink: InkColor | 'All') => set({ selectedInkFilter: ink }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  getTotalCards: () => {
    return get().currentDeck.reduce((sum, item) => sum + item.count, 0);
  },
}));
