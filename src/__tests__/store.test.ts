import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../store/useAuthStore';
import { useDeckStore } from '../store/useDeckStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { usePlaymatStore } from '../store/usePlaymatStore';
import { MOCK_USER_PROFILE, MOCK_JWT_TOKEN } from '../tests/mocks/awsMocks';
import { LorcanaCard } from '../types/lorcana';

describe('Zustand Global Stores QA Suite', () => {
  beforeEach(() => {
    // Reset stores
    useAuthStore.getState().logout();
    useDeckStore.getState().clearDeck();
    useDeckStore.getState().setDeckName('My Magical Deck');
    useDeckStore.getState().setInkFilter('All');
    useDeckStore.getState().setSearchQuery('');
  });

  describe('1. useAuthStore QA Tests', () => {
    it('TC-STORE-01: should initialize with unauthenticated state when storage is empty', () => {
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('TC-STORE-02: should successfully authenticate and store JWT token in session', () => {
      useAuthStore.getState().setAuth(MOCK_USER_PROFILE, MOCK_JWT_TOKEN);
      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe(MOCK_JWT_TOKEN);
      expect(state.user?.username).toBe('TestIllumineer');
      expect(sessionStorage.getItem('lorcana_token')).toBe(MOCK_JWT_TOKEN);
    });

    it('TC-STORE-03: should clear auth and remove tokens on logout', () => {
      useAuthStore.getState().setAuth(MOCK_USER_PROFILE, MOCK_JWT_TOKEN);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      useAuthStore.getState().logout();
      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(state.token).toBeNull();
      expect(state.user).toBeNull();
      expect(sessionStorage.getItem('lorcana_token')).toBeNull();
    });
  });

  describe('2. useDeckStore QA Tests', () => {
    const mockCardA: LorcanaCard = {
      id: '1-140',
      name: 'Elsa - Spirit of Winter',
      cost: 8,
      ink: 'Amethyst',
      type: 'Character',
      isInkable: false,
      inkwell: false,
      imageUrl: 'https://images.lorcana.test/elsa.jpg',
    };

    const mockCardB: LorcanaCard = {
      id: '1-155',
      name: 'Maleficent - Monstrous Dragon',
      cost: 9,
      ink: 'Ruby',
      type: 'Character',
      isInkable: true,
      inkwell: true,
      imageUrl: 'https://images.lorcana.test/mal.jpg',
    };

    it('TC-STORE-04: should add card to deck and update total count', () => {
      useDeckStore.getState().addCard(mockCardA);
      expect(useDeckStore.getState().getTotalCards()).toBe(1);

      useDeckStore.getState().addCard(mockCardB);
      expect(useDeckStore.getState().getTotalCards()).toBe(2);
      expect(useDeckStore.getState().currentDeck.length).toBe(2);
    });

    it('TC-STORE-05: should enforce Lorcana max 4-copy rule limit', () => {
      for (let i = 0; i < 6; i++) {
        useDeckStore.getState().addCard(mockCardA);
      }
      const deck = useDeckStore.getState().currentDeck;
      const elsa = deck.find((c) => c.card.id === mockCardA.id);

      expect(elsa?.count).toBe(4); // Capped strictly at 4
      expect(useDeckStore.getState().getTotalCards()).toBe(4);
    });

    it('TC-STORE-06: should decrement count and remove card when count reaches 0', () => {
      useDeckStore.getState().addCard(mockCardA);
      useDeckStore.getState().addCard(mockCardA);
      expect(useDeckStore.getState().getTotalCards()).toBe(2);

      useDeckStore.getState().removeCard(mockCardA.id);
      expect(useDeckStore.getState().getTotalCards()).toBe(1);

      useDeckStore.getState().removeCard(mockCardA.id);
      expect(useDeckStore.getState().getTotalCards()).toBe(0);
      expect(useDeckStore.getState().currentDeck.length).toBe(0);
    });

    it('TC-STORE-07: should update search query and ink filter cleanly', () => {
      useDeckStore.getState().setSearchQuery('Tinker Bell');
      expect(useDeckStore.getState().searchQuery).toBe('Tinker Bell');

      useDeckStore.getState().setInkFilter('Emerald');
      expect(useDeckStore.getState().selectedInkFilter).toBe('Emerald');
    });
  });

  describe('3. useLanguageStore QA Tests', () => {
    it('TC-STORE-08: should support toggling language between TH and EN', () => {
      useLanguageStore.getState().setLanguage('th');
      expect(useLanguageStore.getState().language).toBe('th');

      useLanguageStore.getState().setLanguage('en');
      expect(useLanguageStore.getState().language).toBe('en');
    });

    it('TC-STORE-09: should return valid translation dictionary for current language', () => {
      useLanguageStore.getState().setLanguage('th');
      const t = useLanguageStore.getState().t;
      expect(t.navHome).toBeDefined();
      expect(t.navMatch).toBeDefined();
      expect(t.navDeckBuilder).toBeDefined();
      expect(t.searchPlaceholder).toBeDefined();
    });
  });

  describe('4. usePlaymatStore QA Tests', () => {
    it('TC-STORE-10: should set and retrieve selected playmat', () => {
      usePlaymatStore.getState().setPlaymatId('stitch-rockstar');
      expect(usePlaymatStore.getState().currentPlaymatId).toBe('stitch-rockstar');

      const playmat = usePlaymatStore.getState().getCurrentPlaymat();
      expect(playmat).toBeDefined();
      expect(playmat.id).toBe('stitch-rockstar');
    });
  });
});
