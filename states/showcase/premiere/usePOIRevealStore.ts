'use client';

import { create } from 'zustand';

export type RevealId = 'audience' | 'cat' | 'fire' | 'moon';

export type RevealItem = {
  id: RevealId;
  src: string;
  xVW: number;
  yVH: number;
  scale: number;
  visible?: boolean;

  // Measured after render:
  screenX?: number;
  screenY?: number;
  width?: number;
  height?: number;
};

type MaskLayoutState = {
  items: Record<RevealId, RevealItem>;
  setItem: (id: RevealId, patch: Partial<RevealItem>) => void;
  mouseX: number;
  mouseY: number;
  setMousePosition: (x: number, y: number) => void;

  // NEW: resets
  reset: () => void;
  resetProgress: () => void;
};

// Keep your initial shapes in a factory so we can recreate fresh objects
const createInitialItems = (): Record<RevealId, RevealItem> => ({
  audience: { id: 'audience', src: '', xVW: 0, yVH: 0, scale: 1, visible: false },
  cat:      { id: 'cat',      src: '', xVW: 0, yVH: 0, scale: 1, visible: true  },
  fire:     { id: 'fire',     src: '', xVW: 0, yVH: 0, scale: 1, visible: false },
  moon:     { id: 'moon',     src: '', xVW: 0, yVH: 0, scale: 1, visible: false },
});

export const usePOIRevealStore = create<MaskLayoutState>((set, get) => ({
  items: createInitialItems(),

  mouseX: 0,
  mouseY: 0,

  setItem: (id, patch) =>
    set((state) => ({
      items: {
        ...state.items,
        [id]: { ...state.items[id], ...patch },
      },
    })),

  setMousePosition: (x, y) => set(() => ({ mouseX: x, mouseY: y })),

  // Full reset to initial shape
  reset: () =>
    set({
      items: createInitialItems(),
      mouseX: 0,
      mouseY: 0,
    }),

  // Keep layout; clear progress/measurements; restore default visibility
  resetProgress: () =>
    set((state) => {
      const entries = Object.entries(state.items) as [RevealId, RevealItem][];
      const next = Object.fromEntries(
        entries.map(([id, it]) => [
          id,
          {
            ...it,
            // your default visibility: cat=true, others=false
            visible: id === 'cat',
            screenX: undefined,
            screenY: undefined,
            width: undefined,
            height: undefined,
          } as RevealItem,
        ])
      ) as Record<RevealId, RevealItem>;

      return { items: next };
    }),
}));
