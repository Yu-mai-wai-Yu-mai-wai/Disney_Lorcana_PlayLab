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
};
