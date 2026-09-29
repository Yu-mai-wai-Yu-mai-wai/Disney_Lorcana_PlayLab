import { UserProfile, AdminBillingData } from '../types/lorcana';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_ENDPOINT || '/api';

export interface AuthResponse {
  message: string;
  token?: string;
  user?: UserProfile;
  error?: string;
}

export const apiService = {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      return data;
    } catch (err: any) {
      return { message: '', error: err.message || 'Network error' };
    }
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }
      return data;
    } catch (err: any) {
      return { message: '', error: err.message || 'Network error' };
    }
  },

  async saveDeck(name: string, cards: any[], token?: string): Promise<{ message: string; deckId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, cards }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save deck');
      return data;
    } catch (err: any) {
      return { message: 'Saved locally', error: err.message };
    }
  },

  async getUserDecks(token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await response.json();
    } catch (err: any) {
      return { decks: [], error: err.message };
    }
  },

  async deleteDeck(deckId: string, token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await response.json();
    } catch (err: any) {
      return { error: err.message };
    }
  },

  async analyzeDeck(deckId: string, token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}/analyze`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await response.json();
    } catch (err: any) {
      return { error: err.message };
    }
  },

  async getDeckAnalysis(deckId: string, token?: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/decks/${deckId}/analysis`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return await response.json();
    } catch (err: any) {
      return { error: err.message };
    }
  },

  async getPlaymat(token: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/playmat`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return null;
      return (await response.json()).playmatId ?? null;
    } catch {
      return null;
    }
  },

  async savePlaymat(playmatId: string, token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me/playmat`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ playmatId }),
      });
      return response.ok;
    } catch {
      return false;
    }
  },

  async verifyAdminPasscode(passcode: string): Promise<{ valid: boolean; role?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/verify-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (response.ok) {
        const data = await response.json();
        return { valid: true, role: data.role || 'admin' };
      }
    } catch (e) {
      // Backend offline: passcode can only be verified server-side
    }
    return { valid: false, error: 'Invalid admin passcode' };
  },

  async elevateToAdmin(passcode: string, token?: string): Promise<{ success: boolean; role?: string; token?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/elevate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ passcode }),
      });
      if (response.ok) {
        const data = await response.json();
        return { success: true, role: data.role || 'admin', token: data.token };
      }
    } catch (e) {
      // Backend offline: passcode can only be verified server-side
    }
    return { success: false, error: 'รหัส Admin ไม่ถูกต้อง (Invalid Admin Passcode)' };
  },

  async getAdminBilling(token?: string): Promise<{ data: AdminBillingData | null; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/billing`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) return { data: null, error: json.error || `HTTP ${response.status}` };
      if (!json.data) return { data: null, error: 'Empty billing response' };
      return { data: json.data };
    } catch (e: any) {
      return { data: null, error: e?.message || 'Network error' };
    }
  },

  async recordMatch(
    matchData: {
      matchId: string;
      winner: string;
      loser: string;
      winnerLore: number;
      loserLore: number;
      turns?: number;
    },
    token?: string
  ): Promise<{ ok?: boolean; matchId?: string; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(matchData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to record match');
      return data;
    } catch (err: any) {
      return { error: err.message || 'Network error' };
    }
  },

  async getMatches(token?: string): Promise<{ matches: any[]; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/matches`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch matches');
      return data;
    } catch (err: any) {
      return { matches: [], error: err.message || 'Network error' };
    }
  },

  async getPlayerStats(username: string): Promise<{ stats: { userId: string; wins: number; losses: number; games: number }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(username)}/stats`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch player stats');
      return data;
    } catch (err: any) {
      return { stats: { userId: username, wins: 0, losses: 0, games: 0 }, error: err.message || 'Network error' };
    }
  },

  async getLeaderboard(): Promise<{
    leaderboard: Array<{
      rank: number;
      userId: string;
      wins: number;
      losses: number;
      games: number;
      winRate: number;
    }>;
    source?: string;
    durationMs?: number;
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch leaderboard');
      return data;
    } catch (err: any) {
      return { leaderboard: [], error: err.message || 'Network error' };
    }
  },
};

