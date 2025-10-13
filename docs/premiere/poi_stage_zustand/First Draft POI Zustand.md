### Running State List

Here’s the consolidated list updated with **Stage**:

---

**(from Spotlight)**

* `overlayVisible: number`
* `maskReady: boolean`
* `trackerNodeRef: SVGCircleElement | null`
* `isDraggingRef: boolean`
* `cx: number`
* `cy: number`
* `r: number`
* `HOVER_THRESHOLD: number`
* `HOLE_SIZE: number`
* `finishedRef: boolean`
* `finishTimerRef: number | null`
* `markerPoints: POI[]`
* `POI: { name: string; x: number; y: number; src: string; visible: boolean }`

**(from StageSetting)**

* `zoom: boolean`
* `bgLayout: { starsTop: string; starsHeight: string; gradientTop: string; gradientHeight: string }`

**(from Cacti)**

* `mounted: boolean`
* `vp: 'mobile' | 'desktop' | 'ultrawide'`
* `centerBlockPctEff: number`
* `effectiveLayers: CactusLayer[]`
* `plan: { layer: CactusLayer; items: { img: string; leftPctStr: string; translateYStr: string; scaleStr: string }[] }[]`
* `CactusLayer: { imgSet: string[]; z: number; opacity: number; heightVh: number; bottomVh?: number; count: number; filter?: string }`

**(from Moon)**

* `YELLOW_THRESHOLD_VH: number`
* `phaseState: number`
* `maskVar: { angleDeg: number; featherPx: number; jitterPx: number; rScale: number }`
* `placement: { topVh: number; top: string; left?: string; right?: string }`
* `src: string`
* `size: string`
* `verticalRangeVh: { min: number; max: number }`
* `leftRangeVw: { min: number; max: number }`
* `rightRangeVw: { min: number; max: number }`
* `side: 'left' | 'right' | 'random'`
* `zIndex: number`
* `alpha: number`
* `waxing: boolean`
* `phase: number`
* `blurId: string`
* `haloId: string`
* `maskId: string`
* `maskIdGlow: string`

**(from Rocks)**

* `ROCKS_CENTER_GAP_PCT: number`
* `ROCKS_EDGE_GUTTER_PCT: number`
* `mounted: boolean`
* `vp: 'mobile' | 'desktop' | 'ultrawide'`
* `centerBlockPctEff: number`
* `effectiveLayers: RockLayer[]`
* `plan: { layer: RockLayer; items: { img: string; leftPctStr: string; translateYStr: string; scaleStr: string }[] }[]`
* `RockLayer: { imgSet: string[]; z: number; opacity: number; heightVh: number; bottomVh?: number; count: number; filter?: string }`
* `visible: boolean`
* `pointerEvents: 'auto' | 'none'`
* `layers: RockLayer[]`
* `centerBlockPct: number`
* `edgeGutterPct: number`
* `seed: number`
* `imgSeed: number`

**(from Grass)**

* `GRASS_CENTER_GAP_PCT: number`
* `GRASS_EDGE_GUTTER_PCT: number`
* `mounted: boolean`
* `vp: 'mobile' | 'desktop' | 'ultrawide'`
* `centerBlockPctEff: number`
* `effectiveLayers: GrassLayer[]`
* `plan: { layer: GrassLayer; items: { img: string; leftPctStr: string; translateYStr: string; scaleStr: string }[] }[]`
* `GrassLayer: { imgSet: string[]; z: number; opacity: number; heightVh: number; bottomVh?: number; count: number; filter?: string }`
* `visible: boolean`
* `pointerEvents: 'auto' | 'none'`
* `layers: GrassLayer[]`
* `centerBlockPct: number`
* `edgeGutterPct: number`
* `seed: number`
* `imgSeed: number`

**(from Audience)**

* `visible: boolean`
* `zoom: boolean`
* `zIndex: number`
* `minSwapMs: number`
* `maxSwapMs: number`
* `baseHeight: string`
* `prefersReduced: boolean`
* `frontIdx: number`
* `imgs: [string, string]`

**(from Campfire)**

* `layer: CampfireLayer | undefined`
* `visible: boolean`
* `zIndex: number | undefined`
* `vw: number`
* `active: CampfireLayer`
* `flameVars: FlameVars`
* `prefersReduced: boolean`
* `frontIdx: number`
* `imgs: [string, string]`
* `CampfireLayer: { z: number; opacity: number; heightVh: number; bottomVh: number; filter?: string }`
* `FlameVars: { heightVh: number; bottomOffsetVh: number; opacity: number; altChance: number; minSwapMs: number; maxSwapMs: number }`

**(from Clouds)**

* `CSSVars: React.CSSProperties & Record<\`--\${string}\`, string | number>\`
* `CloudLayer: { img: string; loopDurationSec: number; z: number; opacity: number; height: string }`
* `height: string`
* `zIndex: number`
* `layers: CloudLayer[]`
* `tileW: number | null`

**(from Sky)**

* `height: string`
* `zIndex: number`

**(from Stage)**

* `params: { left: CurtainParams; right: CurtainParams }`
* `hover: boolean`
* `CurtainParams: { sideOffsetDefault: string; sideOffsetZoomed: string; top: string; height: string; width: string; translateX: string; translateY: string; scaleX: number; scaleY: number }`
* `zoom: boolean`
* `onCurtainClick?: () => void`
* `zIndex: number`

---

Want me to also **normalize** these into a single draft `type State` (flattened, with nested types preserved where helpful), so you can drop it straight into your Zustand store scaffold?
