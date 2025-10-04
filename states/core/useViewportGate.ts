import { create } from 'zustand';

type GateState = {
  widthOK: boolean;
  setWidthOK: (ok: boolean) => void;
};

export const useViewportGate = create<GateState>((set) => ({
  widthOK: false,
  setWidthOK: (ok) => set({ widthOK: ok }),
}));
