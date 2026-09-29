import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('../services/api', () => ({
  apiService: {
    getUserDecks: vi.fn(),
    getPlayerStats: vi.fn(),
    getMatches: vi.fn(),
    getPlaymat: vi.fn(),
  },
}));

import { apiService } from '../services/api';
import { UserDashboard } from '../components/UserDashboard';
import { useAuthStore } from '../store/useAuthStore';

const MOCK_USER = { username: 'alice', email: 'alice@illumineer.cloud', role: 'user' };
const MOCK_STATS = { userId: 'alice', wins: 5, losses: 2, games: 7 };
const MOCK_MATCHES = [
  {
    matchId: 'room1-1727610000',
    opponent: 'bob',
    result: 'WIN',
    myLore: 20,
    opponentLore: 14,
    turns: 8,
    finishedAt: '2026-09-29T12:00:00.000Z',
  },
  {
    matchId: 'room2-1727615000',
    opponent: 'charlie',
    result: 'LOSS',
    myLore: 18,
    opponentLore: 20,
    turns: 9,
    finishedAt: '2026-09-29T12:30:00.000Z',
  },
];

describe('UserDashboard Player Stats & Match History QA Suite (T04)', () => {
  beforeEach(() => {
    vi.mocked(apiService.getUserDecks).mockResolvedValue({ decks: [] });
    vi.mocked(apiService.getPlayerStats).mockResolvedValue({ stats: MOCK_STATS });
    vi.mocked(apiService.getMatches).mockResolvedValue({ matches: MOCK_MATCHES });
    vi.mocked(apiService.getPlaymat).mockResolvedValue(null);
    useAuthStore.setState({ user: MOCK_USER, token: 'mock-token', isAuthenticated: true } as any);
  });

  it('TC-DASH-01: Displays player stats card with correct win rate, wins, losses, games', async () => {
    render(<UserDashboard setActiveTab={vi.fn()} />);

    const statsCard = await screen.findByTestId('player-stats-card');
    expect(statsCard).toBeDefined();
    // 5 wins / 7 games = 71%
    expect(statsCard.textContent).toContain('71% WIN');
    expect(statsCard.textContent).toContain('5');
    expect(statsCard.textContent).toContain('2');
    expect(statsCard.textContent).toContain('7');
  });

  it('TC-DASH-02: Switching to Match History tab displays recent matches with result and scores', async () => {
    render(<UserDashboard setActiveTab={vi.fn()} />);

    const matchesTab = await screen.findByTestId('tab-matches');
    fireEvent.click(matchesTab);

    const matchesList = await screen.findByTestId('match-history-list');
    expect(matchesList).toBeDefined();
    expect(matchesList.textContent).toContain('vs. bob');
    expect(matchesList.textContent).toContain('vs. charlie');
    expect(matchesList.textContent).toContain('WIN');
    expect(matchesList.textContent).toContain('LOSS');
    expect(matchesList.textContent).toContain('8 Turns');
    expect(matchesList.textContent).toContain('9 Turns');
  });

  it('TC-DASH-03: Displays empty state when user has no match history yet', async () => {
    vi.mocked(apiService.getMatches).mockResolvedValue({ matches: [] });
    render(<UserDashboard setActiveTab={vi.fn()} />);

    const matchesTab = await screen.findByTestId('tab-matches');
    fireEvent.click(matchesTab);

    const emptyState = await screen.findByTestId('match-history-empty');
    expect(emptyState).toBeDefined();
  });
});
