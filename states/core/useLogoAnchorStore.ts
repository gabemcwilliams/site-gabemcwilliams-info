'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export type LogoAnchor = {
  // viewport coordinates (fixed positioning)
  left: number;
  top: number;
  width: number;
  height: number;
  // useful derived values
  centerX: number;
  centerY: number;
  // last time we updated (debug)
  ts: number;
};

type LogoAnchorState = {
  anchor: LogoAnchor | null;
  setAnchor: (a: LogoAnchor | null) => void;
};

export const useLogoAnchorStore = create<LogoAnchorState>()(
  subscribeWithSelector((set) => ({
    anchor: null,
    setAnchor: (a) => set({ anchor: a }),
  }))
);
