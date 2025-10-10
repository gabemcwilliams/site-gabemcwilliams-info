'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

const initialSize =
  typeof window !== 'undefined'
    ? { width: window.innerWidth, height: window.innerHeight }
    : { width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT };

type ResizeState = {
  width: number;
  height: number;
  setAll: (w: number, h: number) => void;
};

export const useResizeStore = create<ResizeState>()(
  subscribeWithSelector((set) => ({
    ...initialSize,
    setAll: (w, h) => set({ width: w, height: h }),
  }))
);
