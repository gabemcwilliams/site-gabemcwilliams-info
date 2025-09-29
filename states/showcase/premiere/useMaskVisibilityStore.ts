'use client';

import { create } from 'zustand';

export type SpotlightState = {
  enabled: boolean;
  setEnabled: (val: boolean) => void;
  reset: () => void;
};

export const useMaskVisibilityStore = create<SpotlightState>((set) => ({
  enabled: true,                    // Spotlight starts ON
  setEnabled: (val) => set({ enabled: val }),
  reset: () => set({ enabled: true }),
}));
