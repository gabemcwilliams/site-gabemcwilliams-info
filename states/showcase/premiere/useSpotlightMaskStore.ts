// states/showcase/premiere/useSpotlightMaskStore.ts
'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Core mask values
export type SpotlightMask = {
  cx: number;
  cy: number;
  r: number;
};

// Public store shape
type SpotlightMaskState = {
  // on/off for the whole spotlight layer
  enabled: boolean;

  // current mask geometry
  mask: SpotlightMask;

  // actions
  setEnabled: (on: boolean) => void;
  toggleEnabled: () => void;
  setMask: (patch: Partial<SpotlightMask>) => void;
  setAll: (next: SpotlightMask) => void;

  // helpers
  centerOnViewport: (radius?: number) => void;
  centerOnRect: (rect: { left: number; top: number; width: number; height: number }, radius?: number) => void;
  centerOnElement: (el: HTMLElement, radius?: number) => void;
  centerOnPoint: (x: number, y: number, radius?: number) => void;
  bumpRadius: (delta: number, min?: number, max?: number) => void;

  // debug/reset
  reset: () => void;
};

// safe window width/height (SSR friendly)
const vw = () => (typeof window !== 'undefined' ? window.innerWidth : 1280);
const vh = () => (typeof window !== 'undefined' ? window.innerHeight : 720);

// defaults
const DEFAULT_R = 150;

// internal guards
const isFiniteNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export const useSpotlightMaskStore = create<SpotlightMaskState>()(
  subscribeWithSelector((set, get) => ({
    enabled: true,
    mask: { cx: vw() / 2, cy: vh() / 2, r: DEFAULT_R },

    setEnabled: (on) => set({ enabled: on }),
    toggleEnabled: () => set((s) => ({ enabled: !s.enabled })),

    // Defensive: ignore NaN/invalid fields in patch
    setMask: (patch) =>
      set((s) => {
        const next: SpotlightMask = {
          cx: isFiniteNum(patch.cx) ? patch.cx : s.mask.cx,
          cy: isFiniteNum(patch.cy) ? patch.cy : s.mask.cy,
          r: isFiniteNum(patch.r) ? patch.r : s.mask.r,
        };
        return { mask: next };
      }),

    setAll: (next) =>
      set(() => ({
        mask: {
          cx: isFiniteNum(next.cx) ? next.cx : vw() / 2,
          cy: isFiniteNum(next.cy) ? next.cy : vh() / 2,
          r: isFiniteNum(next.r) ? next.r : DEFAULT_R,
        },
      })),

    centerOnViewport: (radius) =>
      set(() => ({
        mask: { cx: vw() / 2, cy: vh() / 2, r: isFiniteNum(radius) ? radius : get().mask.r },
      })),

    centerOnRect: (rect, radius) =>
      set(() => ({
        mask: {
          cx: rect.left + rect.width / 2,
          cy: rect.top + rect.height / 2,
          r:
            isFiniteNum(radius)
              ? radius
              : Math.max(DEFAULT_R, Math.min(rect.width, rect.height) / 2),
        },
      })),

    centerOnElement: (el, radius) => {
      const rect = el.getBoundingClientRect();
      get().centerOnRect(rect, radius);
    },

    centerOnPoint: (x, y, radius) =>
      set(() => ({
        mask: {
          cx: isFiniteNum(x) ? x : get().mask.cx,
          cy: isFiniteNum(y) ? y : get().mask.cy,
          r: isFiniteNum(radius) ? radius : get().mask.r,
        },
      })),

    bumpRadius: (delta, min = 40, max = Math.max(vw(), vh())) =>
      set((s) => {
        const cur = s.mask.r;
        const d = isFiniteNum(delta) ? delta : 0;
        const next = Math.max(min, Math.min(max, cur + d));
        return { mask: { ...s.mask, r: next } };
      }),

    reset: () =>
      set({
        enabled: true,
        mask: { cx: vw() / 2, cy: vh() / 2, r: DEFAULT_R },
      }),
  }))
);

/** Convenience one-shot getter (no subscription). */
export const getInitialSpotlightMask = () => useSpotlightMaskStore.getState().mask;
/** Convenience one-shot enabled getter (no subscription). */
export const getInitialSpotlightEnabled = () => useSpotlightMaskStore.getState().enabled;
