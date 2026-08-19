import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PLAYMAT_SKINS, type PlaymatSkin } from '../data/playmats';

interface PlaymatState {
  currentPlaymatId: string;
  setPlaymatId: (id: string) => void;
  getCurrentPlaymat: () => PlaymatSkin;
}

export const usePlaymatStore = create<PlaymatState>()(
  persist(
    (set, get) => ({
      currentPlaymatId: 'illuminary-classic',
      setPlaymatId: (id: string) => {
        const exists = PLAYMAT_SKINS.some((skin) => skin.id === id);
        if (exists) {
          set({ currentPlaymatId: id });
        }
      },
      getCurrentPlaymat: () => {
        const currentId = get().currentPlaymatId;
        const skin = PLAYMAT_SKINS.find((s) => s.id === currentId);
        return skin || PLAYMAT_SKINS[0];
      },
    }),
    {
      name: 'lorcana_playmat_storage',
    }
  )
);
