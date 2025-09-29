// states/showcase/premiere/useStageFx.ts
'use client';
import { create } from 'zustand';

export type StageLayer =
  | 'curtains' | 'stage' | 'campfire' | 'audience'
  | 'sky' | 'moon' | 'clouds' | 'cacti' | 'grass' | 'rocks' | 'ground';

export type LayerFlags = {
  layerVisible: boolean;
  layerZoomed: boolean;
  layerEvents: boolean;
};

type State = {
  layers: Record<StageLayer, LayerFlags>;
  setLayer: (id: StageLayer, patch: Partial<LayerFlags>) => void;
  applyScene: (scene: Partial<Record<StageLayer, Partial<LayerFlags>>>) => void;
};

const defaults: Record<StageLayer, LayerFlags> = {
  curtains: { layerVisible: true,  layerZoomed: false, layerEvents: true },
  stage:    { layerVisible: true,  layerZoomed: false, layerEvents: true },
  campfire: { layerVisible: true,  layerZoomed: false, layerEvents: true },
  audience: { layerVisible: true,  layerZoomed: false, layerEvents: true },
  sky:      { layerVisible: true,  layerZoomed: false, layerEvents: true },
  moon:     { layerVisible: true,  layerZoomed: false, layerEvents: true },
  clouds:   { layerVisible: true,  layerZoomed: false, layerEvents: true },
  cacti:    { layerVisible: true,  layerZoomed: false, layerEvents: true },
  grass:    { layerVisible: true,  layerZoomed: false, layerEvents: true },
  rocks:    { layerVisible: true,  layerZoomed: false, layerEvents: true },
  ground:   { layerVisible: true,  layerZoomed: false, layerEvents: true },
};

export const useStageFx = create<State>((set) => ({
  layers: defaults,
  setLayer: (id, patch) =>
    set((s) => ({ layers: { ...s.layers, [id]: { ...s.layers[id], ...patch } } })),
  applyScene: (scene) =>
    set((s) => {
      const next = { ...s.layers };
      for (const key in scene) {
        const id = key as StageLayer;
        next[id] = { ...next[id], ...(scene[id] as Partial<LayerFlags>) };
      }
      return { layers: next };
    }),
}));
