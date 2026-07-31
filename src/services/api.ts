import { UserProfile } from '../types/lorcana';

const API_BASE_URL = 'https://w3jgjq2m78.execute-api.us-east-1.amazonaws.com/prod';

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
};
