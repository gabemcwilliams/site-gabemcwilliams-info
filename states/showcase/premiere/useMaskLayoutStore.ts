'use client';

import { create } from 'zustand';

// Shared shape for all reveal items
export type RevealId = 'audience' | 'cat' | 'fire' | 'moon'

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
};

/** Combined store for layout and mouse position */
export const useMaskLayoutStore = create<MaskLayoutState>((set) => ({
  items: {
    audience: { id: 'audience', src: '', xVW: 0, yVH: 0, scale: 1, visible: false },
    cat:      { id: 'cat',      src: '', xVW: 0, yVH: 0, scale: 1, visible: true  },
    fire:     { id: 'fire',     src: '', xVW: 0, yVH: 0, scale: 1, visible: false },
    moon:     { id: 'moon',     src: '', xVW: 0, yVH: 0, scale: 1, visible: false },
  } as const satisfies Record<RevealId, RevealItem>, // <-- safety net

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
}));
