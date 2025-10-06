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

/** Stage tracking */
export type StageSizePx = { width: number; height: number }
export type StageRectPx = { x: number; y: number; width: number; height: number }

type StageFinalState = {
  // --- stage snapshot (update these on mount/resize/zoom frames) ---
  stageSizePx?: StageSizePx            // inner stage size in px
  stageRectPx?: StageRectPx            // absolute rect in the page (optional but useful)
  stageScale?: number                   // width / 2000 (your canonical stage width)
  zoomScale?: number                    // layout.stage.zoomScale (breakpoint-specific)
  visualZoomOn?: boolean                // whether zoom visuals are active

  // --- finals written by Stage after computing layout ---
  emblem?: EmblemFinal
  curtains: { left?: CurtainFinal; right?: CurtainFinal }
  frame?: FrameFinal

  // debug flag
  debug: boolean
}

type Actions = {
  // stage setters
  setStageSize: (v: StageSizePx) => void
  setStageRect: (v: StageRectPx) => void
  setStageScale: (v: number) => void
  setZoomScale: (v: number) => void
  setVisualZoom: (v: boolean) => void
  /** convenience: update multiple stage fields at once */
  commitStageSnapshot: (
    v: Partial<
      Pick<
        StageFinalState,
        'stageSizePx' | 'stageRectPx' | 'stageScale' | 'zoomScale' | 'visualZoomOn'
      >
    >
  ) => void

  // finals
  setEmblem: (v: EmblemFinal) => void
  setCurtain: (side: 'left' | 'right', v: CurtainFinal) => void
  setFrame: (v: FrameFinal) => void

  // debug controls
  setDebug: (enabled: boolean) => void
  debugDump: (label?: string) => void

  // utility
  reset: () => void
}

export type ArtifactPlacementStore = StageFinalState & Actions

export const useArtifactPlacementStore = create<ArtifactPlacementStore>((set, get) => ({
  // stage snapshot
  stageSizePx: undefined,
  stageRectPx: undefined,
  stageScale: undefined,
  zoomScale: undefined,
  visualZoomOn: undefined,

  // finals
  emblem: undefined,
  curtains: {},
  frame: undefined,

  // stage setters
  setStageSize: (v) => set({ stageSizePx: v }),
  setStageRect: (v) => set({ stageRectPx: v }),
  setStageScale: (v) => set({ stageScale: v }),
  setZoomScale: (v) => set({ zoomScale: v }),
  setVisualZoom: (v) => set({ visualZoomOn: v }),
  commitStageSnapshot: (v) => set(v),

  // finals setters
  setEmblem: (v) => set({ emblem: v }),
  setCurtain: (side, v) => set((s) => ({ curtains: { ...s.curtains, [side]: v } })),
  setFrame: (v) => set({ frame: v }),

  // debug
  debug: false,
  setDebug: (enabled) => set({ debug: enabled }),
  debugDump: (label) => {
    const s = get()
    if (!s.debug) return
    console.groupCollapsed(label ?? 'Stage snapshot')
    console.dir(
      {
        stageSizePx: s.stageSizePx,
        stageRectPx: s.stageRectPx,
        stageScale: s.stageScale,
        zoomScale: s.zoomScale,
        visualZoomOn: s.visualZoomOn,

        emblem: s.emblem,
        curtains: s.curtains,
        frame: s.frame,
      },
      { depth: null }
    )
    console.groupEnd()
  },

  // utility
  reset: () =>
    set({
      stageSizePx: undefined,
      stageRectPx: undefined,
      stageScale: undefined,
      zoomScale: undefined,
      visualZoomOn: undefined,
      emblem: undefined,
      curtains: {},
      frame: undefined,
    }),
}))
