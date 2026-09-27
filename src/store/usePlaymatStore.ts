import { create } from 'zustand';
import { PLAYMAT_SKINS, type PlaymatSkin } from '../data/playmats';
import { apiService } from '../services/api';
import { useAuthStore } from './useAuthStore';

// Playmat belongs to the account (UsersTable.playmatId on AWS), not to the browser
const DEFAULT_PLAYMAT_ID = PLAYMAT_SKINS[0].id;
const isKnownPlaymat = (id: unknown): id is string => PLAYMAT_SKINS.some((skin) => skin.id === id);

interface PlaymatState {
  currentPlaymatId: string;
  setPlaymatId: (id: string) => void;
  getCurrentPlaymat: () => PlaymatSkin;
  loadFromServer: () => Promise<void>;
  reset: () => void;
}

export const usePlaymatStore = create<PlaymatState>()((set, get) => ({
  currentPlaymatId: DEFAULT_PLAYMAT_ID,
  setPlaymatId: (id: string) => {
    if (!isKnownPlaymat(id)) return;
    set({ currentPlaymatId: id });
    const token = useAuthStore.getState().token;
    if (token) void apiService.savePlaymat(id, token);
  },
  getCurrentPlaymat: () => PLAYMAT_SKINS.find((s) => s.id === get().currentPlaymatId) || PLAYMAT_SKINS[0],
  loadFromServer: async () => {
    const token = useAuthStore.getState().token;
    if (!token) return;
    const saved = await apiService.getPlaymat(token);
    set({ currentPlaymatId: isKnownPlaymat(saved) ? saved : DEFAULT_PLAYMAT_ID });
  },
  reset: () => set({ currentPlaymatId: DEFAULT_PLAYMAT_ID }),
}));
