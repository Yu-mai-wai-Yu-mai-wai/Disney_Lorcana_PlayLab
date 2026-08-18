import { UserProfile } from '../types/lorcana';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_ENDPOINT || 'https://iorxmxsoll.execute-api.us-east-1.amazonaws.com/prod';


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
};
