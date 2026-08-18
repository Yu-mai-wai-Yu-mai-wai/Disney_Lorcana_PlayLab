import { create } from 'zustand';
import { AuthState, UserProfile } from '../types/lorcana';

export const useAuthStore = create<AuthState>((set) => {
  // Load initial state: strictly use sessionStorage first so each tab is an independent session
  const savedToken =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('lorcana_token') || localStorage.getItem('lorcana_token')
      : null;
  const savedUser =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('lorcana_user') || localStorage.getItem('lorcana_user')
      : null;

  let initialUser: UserProfile | null = null;
  if (savedUser) {
    try {
      initialUser = JSON.parse(savedUser);
    } catch (e) {
      initialUser = null;
    }
  }

  // Ensure sessionStorage has the session loaded so tab stays isolated
  if (typeof window !== 'undefined' && savedToken && savedUser) {
    try {
      sessionStorage.setItem('lorcana_token', savedToken);
      sessionStorage.setItem('lorcana_user', savedUser);
    } catch (e) {
      // ignore
    }
  }

  return {
    user: initialUser,
    token: savedToken,
    isAuthenticated: !!(savedToken && initialUser),

    setAuth: (user: UserProfile, token: string) => {
      try {
        // Strictly save to sessionStorage for this tab only!
        sessionStorage.setItem('lorcana_token', token);
        sessionStorage.setItem('lorcana_user', JSON.stringify(user));
        // Do NOT overwrite localStorage with new tab login to prevent other open tabs from leaking/switching account
      } catch (e) {
        console.warn('Storage write failed', e);
      }
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      try {
        sessionStorage.removeItem('lorcana_token');
        sessionStorage.removeItem('lorcana_user');
        localStorage.removeItem('lorcana_token');
        localStorage.removeItem('lorcana_user');
      } catch (e) {
        console.warn('Storage remove failed', e);
      }
      set({ user: null, token: null, isAuthenticated: false });
    },
  };
});

