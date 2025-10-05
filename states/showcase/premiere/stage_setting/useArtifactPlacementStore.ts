// useArtifactPlacementStore.ts
import { create } from 'zustand'

/** Final values you commit after computing in your component */
export type CurtainFinal = {
  /** resolved side offset actually used (default or zoomed), e.g. '3%' or '24%' */
  sideOffset: string
  top: string
  width: string
  height: string
  /** e.g. 'translate(-16%, 0%) scale(2.8, 2.8)' or 'translate(0, 0) scale(1, 1)' */
  transform: string
}

export type EmblemFinal = {
  top: string
  width: string
}

/** Frame is width-driven with an applied shared zoom transform */
export type FrameFinal = {
  width: string    // e.g. '100%'
  height: string   // e.g. 'auto'
  transform: string // e.g. 'scale(3.4)' or 'scale(1)'
}

/** Arch final sizing/position if/when you apply it */
export type ArchFinal = {
  width: string
  height: string
  transform?: string
  top?: string
  left?: string
}

type StageFinalState = {
  arch?: ArchFinal
  emblem?: EmblemFinal
  curtains: {
    left?: CurtainFinal
    right?: CurtainFinal
  }
  frame?: FrameFinal

  // debug flag
  debug: boolean
}

type Actions = {
  setArch: (v: ArchFinal) => void
  setEmblem: (v: EmblemFinal) => void
  setCurtain: (side: 'left' | 'right', v: CurtainFinal) => void
  setFrame: (v: FrameFinal) => void

  // debug controls
  setDebug: (enabled: boolean) => void
  debugDump: (label?: string) => void
}

export type ArtifactPlacementStore = StageFinalState & Actions

export const useArtifactPlacementStore = create<ArtifactPlacementStore>((set, get) => ({
  arch: undefined,
  emblem: undefined,
  curtains: {},
  frame: undefined,

  debug: false,

  setArch: (v) => set({ arch: v }),
  setEmblem: (v) => set({ emblem: v }),
  setCurtain: (side, v) =>
    set((s) => ({ curtains: { ...s.curtains, [side]: v } })),
  setFrame: (v) => set({ frame: v }),

  setDebug: (enabled) => set({ debug: enabled }),

  debugDump: (label) => {
    if (!get().debug) return
    const snapshot = {
      arch: get().arch,
      emblem: get().emblem,
      curtains: get().curtains,
      frame: get().frame,
    }
    const title = label ?? 'ArtifactPlacement Snapshot'
    // Pretty, collapsible output
    // You can change to console.log(JSON.stringify(snapshot, null, 2)) if you prefer plain JSON
    // @ts-ignore - groupCollapsed exists at runtime
    console.groupCollapsed?.(title)
    console.table
      ? console.table(snapshot)
      : console.log(snapshot)
    // @ts-ignore
    console.groupEnd?.()
  },
}))
