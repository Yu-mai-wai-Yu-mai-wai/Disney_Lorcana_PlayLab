import { create } from 'zustand';
import { AuthState, UserProfile } from '../types/lorcana';

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state from localStorage
  const savedToken = localStorage.getItem('lorcana_token');
  const savedUser = localStorage.getItem('lorcana_user');

  let initialUser: UserProfile | null = null;
  if (savedUser) {
    try {
      initialUser = JSON.parse(savedUser);
    } catch (e) {
      initialUser = null;
    }
  }

  return {
    user: initialUser,
    token: savedToken,
    isAuthenticated: !!(savedToken && initialUser),

    setAuth: (user: UserProfile, token: string) => {
      localStorage.setItem('lorcana_token', token);
      localStorage.setItem('lorcana_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('lorcana_token');
      localStorage.removeItem('lorcana_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});
