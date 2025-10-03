// states/showcase/premiere/useSpotlightMaskStore.ts
'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SpotlightMask = { cx: number; cy: number; r: number };

type SpotlightMaskState = {
  enabled: boolean;
  mask: SpotlightMask;

  // NEW: single-use seed
  seed: SpotlightMask | null;
  setSeed: (m: SpotlightMask) => void;
  consumeSeed: () => SpotlightMask | null;

  setEnabled: (on: boolean) => void;
  toggleEnabled: () => void;
  setMask: (patch: Partial<SpotlightMask>) => void;
  setAll: (next: SpotlightMask) => void;

  centerOnViewport: (radius?: number) => void;
  centerOnRect: (rect: { left: number; top: number; width: number; height: number }, radius?: number) => void;
  centerOnElement: (el: HTMLElement, radius?: number) => void;
  centerOnPoint: (x: number, y: number, radius?: number) => void;
  bumpRadius: (delta: number, min?: number, max?: number) => void;
  reset: () => void;
};

const vw = () => (typeof window !== 'undefined' ? window.innerWidth : 1280);
const vh = () => (typeof window !== 'undefined' ? window.innerHeight : 720);
const DEFAULT_R = 150;

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);

export const useSpotlightMaskStore = create<SpotlightMaskState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      enabled: true,
      mask: { cx: vw() / 2, cy: vh() / 2, r: DEFAULT_R },


      // NEW: seed impl
      seed: null,
      setSeed: (m) =>
        set({
          seed: {
            cx: finite(m.cx) ? m.cx : vw() / 2,
            cy: finite(m.cy) ? m.cy : vh() / 2,
            r: finite(m.r) ? m.r : DEFAULT_R,
          },
        }),
      consumeSeed: () => {
        const s = get().seed;
        if (s) set({ seed: null }); // one-shot
        return s;
      },

        setEnabled: (on) => set({enabled: on}),
      toggleEnabled: () => set((s) => ({ enabled: !s.enabled })),

      setMask: (patch) =>
        set((s) => ({
          mask: {
            cx: finite(patch.cx) ? patch.cx : s.mask.cx,
            cy: finite(patch.cy) ? patch.cy : s.mask.cy,
            r: finite(patch.r) ? patch.r : s.mask.r,
          },
        })),
      setAll: (next) =>
        set(() => ({
          mask: {
            cx: finite(next.cx) ? next.cx : vw() / 2,
            cy: finite(next.cy) ? next.cy : vh() / 2,
            r: finite(next.r) ? next.r : DEFAULT_R,
          },
        })),

      centerOnViewport: (radius) =>
        set(() => ({
          mask: { cx: vw() / 2, cy: vh() / 2, r: finite(radius) ? radius : get().mask.r },
        })),
      centerOnRect: (rect, radius) =>
        set(() => ({
          mask: {
            cx: rect.left + rect.width / 2,
            cy: rect.top + rect.height / 2,
            r: finite(radius) ? radius : Math.max(DEFAULT_R, Math.min(rect.width, rect.height) / 2),
          },
        })),
      centerOnElement: (el, radius) => get().centerOnRect(el.getBoundingClientRect(), radius),
      centerOnPoint: (x, y, radius) =>
        set(() => ({ mask: { cx: finite(x) ? x : get().mask.cx, cy: finite(y) ? y : get().mask.cy, r: finite(radius) ? radius : get().mask.r } })),
      bumpRadius: (delta, min = 40, max = Math.max(vw(), vh())) =>
        set((s) => ({ mask: { ...s.mask, r: Math.max(min, Math.min(max, s.mask.r + (finite(delta) ? delta : 0))) } })),
      reset: () => set({ enabled: true, mask: { cx: vw() / 2, cy: vh() / 2, r: DEFAULT_R } }),
    })),
    {
      name: 'spotlight-mask',
      version: 1,
      partialize: (s) => ({ enabled: s.enabled, mask: s.mask, seed: s.seed }), // persist seed too
      storage: typeof window !== 'undefined' ? createJSONStorage(() => sessionStorage) : undefined,
    }
  )
);
