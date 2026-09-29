import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

vi.mock('../services/api', () => ({
  apiService: { getUserDecks: vi.fn() },
}));

import { apiService } from '../services/api';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { useAuthStore } from '../store/useAuthStore';
import { useDeckStore } from '../store/useDeckStore';

// Same hand-computed deck as backend/__tests__/deckAnalysis.test.ts (12 cards)
const CARDS_A = [
  { card: { id: 'a', cost: 1, inkwell: true, ink: 'Amber', type: 'Character', lore: 1 }, count: 4 },
  { card: { id: 'b', cost: 3, inkwell: true, ink: 'Amber', type: 'Character', lore: 2 }, count: 4 },
  { card: { id: 'c', cost: 5, inkwell: false, ink: 'Steel', type: 'Action', lore: 0 }, count: 2 },
  { card: { id: 'd', cost: 11, inkwell: true, ink: 'Steel', type: 'Item' }, count: 1 },
  { card: { id: 'e', cost: 2, inkwell: false, ink: 'Steel', type: 'Location', lore: 1 }, count: 1 },
];
// 4 cards, all cost 6, all inkable, one ink
const CARDS_B = [{ card: { id: 'z', cost: 6, inkwell: true, ink: 'Ruby', type: 'Character', lore: 3 }, count: 4 }];

const DECK_A = { deckId: 'deck_1', userId: 'u', name: 'Amber Steel Test', cards: CARDS_A, updatedAt: '2026-09-28T00:00:00.000Z' };
const DECK_B = { deckId: 'deck_2', userId: 'u', name: 'Ruby Fours', cards: CARDS_B, updatedAt: '2026-09-28T00:00:00.000Z' };

const text = (id: string) => screen.getByTestId(id).textContent ?? '';

describe('AnalyticsDashboard uses real deck data (TC-ANA-001..)', () => {
  beforeEach(() => {
    vi.mocked(apiService.getUserDecks).mockReset();
    useAuthStore.setState({ token: 'tok', isAuthenticated: true } as any);
    useDeckStore.setState({ currentDeck: [] } as any);
  });

  it('TC-ANA-001 shows values computed from the selected saved deck', async () => {
    vi.mocked(apiService.getUserDecks).mockResolvedValue({ decks: [DECK_A] });
    render(<AnalyticsDashboard />);
    await screen.findByTestId('kpi-avg-cost');
    expect(text('kpi-avg-cost')).toContain('3.25');
    expect(text('kpi-inkable-ratio')).toContain('75%');
    expect(text('kpi-inkable-detail')).toContain('9');
    expect(text('kpi-inkable-detail')).toContain('3');
    expect(text('kpi-lore')).toContain('12');
    expect(text('kpi-synergy')).toContain('70');
    expect(text('deck-total')).toContain('12');
    expect(text('deck-name')).toContain('Amber Steel Test');
  });

  it('TC-ANA-002 switching deck changes every number', async () => {
    vi.mocked(apiService.getUserDecks).mockResolvedValue({ decks: [DECK_A, DECK_B] });
    render(<AnalyticsDashboard />);
    await screen.findByTestId('kpi-avg-cost');
    fireEvent.change(screen.getByTestId('deck-select'), { target: { value: 'deck_2' } });
    await waitFor(() => expect(text('kpi-avg-cost')).toContain('6'));
    expect(text('kpi-avg-cost')).not.toContain('3.25');
    expect(text('kpi-inkable-ratio')).toContain('100%');
    expect(text('kpi-lore')).toContain('12'); // 4 x lore 3
    expect(text('deck-total')).toContain('4');
  });

  it('TC-ANA-003 unsaved deck in the builder is selectable when the user has no saved decks', async () => {
    vi.mocked(apiService.getUserDecks).mockResolvedValue({ decks: [] });
    useDeckStore.setState({ currentDeck: CARDS_B, deckName: 'Draft' } as any);
    render(<AnalyticsDashboard />);
    await screen.findByTestId('kpi-avg-cost');
    expect(text('kpi-avg-cost')).toContain('6');
    expect(text('deck-name')).toContain('Draft');
  });

  it('TC-ANA-004 empty state (no decks) points the user to the deck builder, no fake numbers', async () => {
    vi.mocked(apiService.getUserDecks).mockResolvedValue({ decks: [] });
    render(<AnalyticsDashboard />);
    await screen.findByTestId('analytics-empty');
    expect(screen.queryByTestId('kpi-avg-cost')).toBeNull();
  });

  it('TC-ANA-005 logged out with no builder deck: empty state and no API call', async () => {
    useAuthStore.setState({ token: null, isAuthenticated: false } as any);
    render(<AnalyticsDashboard />);
    await screen.findByTestId('analytics-empty');
    expect(apiService.getUserDecks).not.toHaveBeenCalled();
  });

  it('TC-ANA-006 API failure shows an error message instead of stale/fake numbers', async () => {
    vi.mocked(apiService.getUserDecks).mockResolvedValue({ decks: [], error: 'network down' });
    render(<AnalyticsDashboard />);
    await screen.findByTestId('analytics-error');
  });

  it('TC-ANA-007 no hardcoded demo values left in the component source', () => {
    const src = readFileSync(resolve(__dirname, '../components/AnalyticsDashboard.tsx'), 'utf-8');
    for (const needle of ['Simulated', '85%', 'Amber/Amethyst Tempo', "'Mickey Mouse", '15 Cards Peak']) {
      expect(src, needle).not.toContain(needle);
    }
    expect(src).not.toMatch(/>\s*88\s*</);
    expect(src).not.toMatch(/>\s*3\.4\s*</);
    expect(src).toContain('analyzeDeck'); // shared formula, not a private copy
  });
});
