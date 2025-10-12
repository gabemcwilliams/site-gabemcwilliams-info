'use client';

import React, {
  memo,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type CSSProperties,
} from 'react';
import { useRouter } from 'next/navigation';
import { useArtifactPlacementStore } from '@/states/showcase/premiere/stage_setting/useArtifactPlacementStore';

/* =========================
   Types
   ========================= */
interface CurtainParams {
  sideOffsetDefault: string;
  sideOffsetZoomed: string;
  top: string;
  height: string;
  width: string;
  translateX: string;
  scaleX: number;
  scaleY: number;
}

type Layout = {
  stage: {
    innerWidth: string; // clamp(min, pref, max)
    padTop: string;     // px
    padBottom: string;  // vh
    zoomScale: number;
  };
  emblem: { top: string; width: string };
  curtains: { left: CurtainParams; right: CurtainParams };
};

// Props
export interface StageProps {
  zoom?: boolean;
  closeup?: boolean;
  onCurtainClick?: () => void;
  onEmblemClick?: () => void;
  zIndex?: number;
}

/* =========================
   Assets
   ========================= */
const ASSETS = {
  emblem: '/assets/showcase/premiere/stage_setting/emblem/stage_arch_emblem_base.svg',
  emblemHighlighted: '/assets/showcase/premiere/stage_setting/emblem/stage_arch_emblem_highlighted.svg',
  curtainLeft: '/assets/showcase/premiere/stage_setting/stage/stage_curtain_left.svg',
  curtainRight: '/assets/showcase/premiere/stage_setting/stage/stage_curtain_right.svg',
  frame: '/assets/showcase/premiere/stage_setting/stage/stage_frame_full.svg',
} as const;

const ASPECT_RATIO = '2000 / 1000';

/* =========================
   Layout (ratio + caps)
   ========================= */


// Ratio knobs
const STAGE_RATIO_BASE = 0.36; // overall baseline (in vw units)
const STAGE_RATIO_MULT = 0.10; // responsiveness to aspect

// Hard caps for stage width (px)
const STAGE_MIN_PX = 10;   // feel free to lower/raise
const STAGE_MAX_PX = 900;  // canonical upper bound you had before

// Top padding curve (unchanged behavior)
const TOP_PAD_VH_BASE  = 0.450; // 35% of viewport height baseline
const TOP_PAD_STRENGTH = 0.25;  // curvature strength
const TOP_PAD_EXPONENT = 1.5;   // curvature exponent

// Bottom padding as pure vh
const PAD_BOTTOM_VH = 1;

// Emblem ratios relative to the stage box
const EMBLEM_TOP_RATIO   = 0.075;
const EMBLEM_WIDTH_RATIO = 0.05;

const pct = (n: number) => `${n * 100}%`;

/** Aspect-aware ratio that reacts to both width & height */
function computeStageRatio(vw: number, vh: number): number {
  const aspect = vw / Math.max(1, vh);          // protect divide-by-zero
  const logFactor = Math.log10(aspect + 1);     // ~0 → ~1.3 typical
  return STAGE_RATIO_BASE + STAGE_RATIO_MULT * logFactor;
}

/* =========================
   Hooks
   ========================= */
function useViewportSize(initialW = 1200, initialH = 800) {
  const [size, setSize] = useState({ vw: initialW, vh: initialH });
  useEffect(() => {
    const onResize = () => setSize({ vw: window.innerWidth, vh: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

type ZoomPhase = 'unzoomed' | 'zooming' | 'zoomed' | 'redirecting';

function useCurtainNavigation(onCurtainClick?: () => void) {
  const router = useRouter();
  const [phase, setPhase] = useState<ZoomPhase>('unzoomed');
  const isZoomed = phase === 'zooming' || phase === 'zoomed' || phase === 'redirecting';

  const handleCurtainActivate = useCallback(() => {
    onCurtainClick?.();

    if (phase === 'unzoomed') {
      setPhase('zooming');
      window.setTimeout(() => setPhase('zoomed'), 1500);
      return;
    }

    if (phase === 'zoomed') {
      setPhase('redirecting');
      window.setTimeout(() => router.push('/coming-soon'), 400);
    }
  }, [onCurtainClick, phase, router]);

  const handleCurtainKey: React.KeyboardEventHandler<HTMLImageElement> = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCurtainActivate();
      }
    },
    [handleCurtainActivate]
  );

  return { phase, isZoomed, handleCurtainActivate, handleCurtainKey };
}

/* =========================
   Layout computer (ratio + clamp)
   ========================= */
function computeLayout(vwPx: number, vhPx: number): Layout {
  // 1) Ratio reacts to both vw & vh
  const ratio = computeStageRatio(vwPx, vhPx);         // e.g., ~0.46..0.56

  // 2) Preferred width in vw, but expose caps via CSS clamp()
  const preferredVW = `${(ratio * 100).toFixed(3)}vw`;
  const innerWidth = `clamp(${STAGE_MIN_PX}px, ${preferredVW}, ${STAGE_MAX_PX}px)`;

  // 3) For the top padding curve we need the *effective* width in px if clamps apply
  const stageWidthPxEffective = Math.min(Math.max(STAGE_MIN_PX, ratio * vwPx), STAGE_MAX_PX);

  // Shape the top padding as screens get smaller, no hard caps on the padding itself
  const canonicalMax = STAGE_MAX_PX; // just for shaping the curve
  const filled = stageWidthPxEffective / canonicalMax; // <=1 typical
  const shrink = Math.max(0, 1 - filled);              // 1 at tiny widths → 0 as we near max
  const topPadPxRaw =
    (TOP_PAD_VH_BASE * vhPx) * (1 + TOP_PAD_STRENGTH * Math.pow(shrink, TOP_PAD_EXPONENT));

  const stage = {
    innerWidth,                                   // <-- capped via clamp()
    padTop: `${Math.round(topPadPxRaw)}px`,
    padBottom: `${(PAD_BOTTOM_VH * 100).toFixed(3)}vh`,
    zoomScale: 3.4,
  };

  const emblem = { top: pct(EMBLEM_TOP_RATIO), width: pct(EMBLEM_WIDTH_RATIO) };

  const baseCurtain = {
    sideOffsetDefault: '8%',
    sideOffsetZoomed: '20%',
    top: '31%',
    width: '50%',
    height: '60.5%',
    translateXMag: '16%',
    scaleX: 4.8,
    scaleY: 3.6,
  };

  const curtains = {
    left: {
      sideOffsetDefault: baseCurtain.sideOffsetDefault,
      sideOffsetZoomed: baseCurtain.sideOffsetZoomed,
      top: baseCurtain.top,
      width: baseCurtain.width,
      height: baseCurtain.height,
      translateX: `-${baseCurtain.translateXMag}`,
      scaleX: baseCurtain.scaleX,
      scaleY: baseCurtain.scaleY,
    },
    right: {
      sideOffsetDefault: baseCurtain.sideOffsetDefault,
      sideOffsetZoomed: baseCurtain.sideOffsetZoomed,
      top: baseCurtain.top,
      width: baseCurtain.width,
      height: baseCurtain.height,
      translateX: baseCurtain.translateXMag,
      scaleX: baseCurtain.scaleX,
      scaleY: baseCurtain.scaleY,
    },
  };

  return { stage, emblem, curtains };
}

/* =========================
   Component
   ========================= */
function Stage({
  zoom,
  closeup = false,
  onCurtainClick,
  onEmblemClick,
  zIndex = 2,
}: StageProps) {
  const { vw, vh } = useViewportSize(1200, 800);
  const layout = useMemo(() => computeLayout(vw, vh), [vw, vh]);

  // const [hover, setHover] = useState(false);
  const { phase, isZoomed, handleCurtainActivate, handleCurtainKey } =
    useCurtainNavigation(onCurtainClick);

  const visualZoomOn = Boolean(zoom) || isZoomed;
  const sharedZoom = visualZoomOn ? `scale(${layout.stage.zoomScale})` : 'scale(1)';

  // Track the real stage size/rect/scale continuously
  const stageRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    const api = useArtifactPlacementStore.getState();
    const push = () => {
      const r = el.getBoundingClientRect();
      const stageScale = r.width / 2000; // canonical width = 2000
      api.commitStageSnapshot?.({
        stageSizePx: { width: r.width, height: r.height },
        stageRectPx: { x: r.left, y: r.top, width: r.width, height: r.height },
        stageScale,
        zoomScale: layout.stage.zoomScale,
        visualZoomOn,
      });
      if (process.env.NODE_ENV === 'development') api.setDebug(true);
      api.debugDump?.('Stage size/rect');
    };

    push(); // initial
    const ro = new ResizeObserver(push);
    ro.observe(el);
    window.addEventListener('scroll', push, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', push);
    };
  }, [layout.stage.zoomScale, visualZoomOn]);

  // Emblem lever: derive from stage snapshot and LOG (no store write)
  useEffect(() => {
    const api = useArtifactPlacementStore.getState();
    const p = (s: string) => parseFloat(s) / 100;

    const computeAndLog = () => {
      const size = api.stageSizePx;
      const rect = api.stageRectPx;
      if (!size) return;

      const widthRatio = p(layout.emblem.width);
      const topRatio   = p(layout.emblem.top);

      const widthPx = size.width * widthRatio;
      const cxPx    = (rect?.x ?? 0) + size.width * 0.5;
      const yPx     = (rect?.y ?? 0) + size.height * topRatio;

      console.groupCollapsed('[Emblem lever]');
      console.table([{
        widthRatio: +widthRatio.toFixed(4),
        topRatio:   +topRatio.toFixed(4),
        widthPx:    Math.round(widthPx),
        cxPx:       Math.round(cxPx),
        yPx:        Math.round(yPx),
      }]);
      console.groupEnd();
    };

    computeAndLog();
    const unsubscribe = useArtifactPlacementStore.subscribe(() => computeAndLog());
    return () => unsubscribe();
  }, [layout.emblem.top, layout.emblem.width]);

  // Write finals (curtains/frame only)
  useEffect(() => {
    const api = useArtifactPlacementStore.getState();

    const leftSideOffset = !visualZoomOn
      ? layout.curtains.left.sideOffsetDefault
      : layout.curtains.left.sideOffsetZoomed;

    const rightSideOffset = !visualZoomOn
      ? layout.curtains.right.sideOffsetDefault
      : layout.curtains.right.sideOffsetZoomed;

    const leftTransform = visualZoomOn
      ? `translate(${layout.curtains.left.translateX}, 0%) scale(${layout.curtains.left.scaleX}, ${layout.curtains.left.scaleY})`
      : 'translate(0, 0) scale(1, 1)';

    const rightTransform = visualZoomOn
      ? `translate(${layout.curtains.right.translateX}, 0%) scale(${layout.curtains.right.scaleX}, ${layout.curtains.right.scaleY})`
      : 'translate(0, 0) scale(1, 1)';

    api.setCurtain('left', {
      sideOffset: leftSideOffset,
      top: layout.curtains.left.top,
      width: layout.curtains.left.width,
      height: layout.curtains.left.height,
      transform: leftTransform,
    });

    api.setCurtain('right', {
      sideOffset: rightSideOffset,
      top: layout.curtains.right.top,
      width: layout.curtains.right.width,
      height: layout.curtains.right.height,
      transform: rightTransform,
    });

    api.setFrame({
      width: '100%',
      height: 'auto',
      transform: sharedZoom,
    });

    if (process.env.NODE_ENV === 'development') api.setDebug(true);
    api.debugDump?.('Stage final');
  }, [layout, visualZoomOn, sharedZoom]);

  // Root and inner styles
  const rootStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      inset: 0,
      zIndex,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: layout.stage.padTop,
      paddingBottom: layout.stage.padBottom,
      backgroundColor: 'transparent',
      overflow: 'hidden',
      cursor: 'default',
    }),
    [zIndex, layout.stage.padTop, layout.stage.padBottom]
  );

  const innerStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      width: layout.stage.innerWidth, // clamp(min px, pref vw, max px)
      aspectRatio: ASPECT_RATIO,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
      height: 'auto',
    }),
    [layout.stage.innerWidth]
  );

  const [hover, setHover] = useState(false);
  const handleEmblem = useCallback(() => {
    if (onEmblemClick) onEmblemClick();
    else window.location.href = '/';
  }, [onEmblemClick]);

  const handleEmblemKey: React.KeyboardEventHandler<HTMLImageElement> = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEmblem();
      }
    },
    [handleEmblem]
  );

  return (
    <div style={rootStyle}>
      <div ref={stageRef} style={innerStyle}>
        {/* Emblem */}
        <img
          src={hover ? ASSETS.emblemHighlighted : ASSETS.emblem}
          alt="Stage Emblem"
          role="button"
          tabIndex={0}
          onKeyDown={handleEmblemKey}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={handleEmblem}
          style={{
            position: 'absolute',
            top: layout.emblem.top,
            left: '50%',
            width: layout.emblem.width,
            transform: 'translateX(-50%)',
            transformOrigin: 'center top',
            zIndex: 410,
            opacity: closeup ? 0 : 1,
            pointerEvents: closeup ? 'none' : 'auto',
            cursor: closeup ? 'default' : 'pointer',
            transition: 'opacity 240ms ease',
          }}
        />

        {/* Left Curtain */}
        <img
          src={ASSETS.curtainLeft}
          alt="Curtain Left"
          role={phase === 'unzoomed' || phase === 'zoomed' ? 'button' : undefined}
          tabIndex={phase === 'unzoomed' || phase === 'zoomed' ? 0 : -1}
          onClick={handleCurtainActivate}
          onKeyDown={handleCurtainKey}
          style={{
            position: 'absolute',
            left: !visualZoomOn
              ? layout.curtains.left.sideOffsetDefault
              : layout.curtains.left.sideOffsetZoomed,
            top: layout.curtains.left.top,
            width: layout.curtains.left.width,
            height: layout.curtains.left.height,
            objectFit: 'cover',
            zIndex: 250,
            cursor: phase === 'zooming' ? 'default' : 'pointer',
            pointerEvents: phase === 'zooming' ? 'none' : 'auto',
            transform: visualZoomOn
              ? `translate(${layout.curtains.left.translateX}, 0%) scale(${layout.curtains.left.scaleX}, ${layout.curtains.left.scaleY})`
              : 'translate(0, 0) scale(1, 1)',
            transition: 'transform 1.5s ease-in-out',
            transformOrigin: 'right center',
          }}
        />

        {/* Frame */}
        <img
          src={ASSETS.frame}
          alt="Stage Frame"
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            zIndex: 200,
            pointerEvents: 'none',
            transform: sharedZoom,
            opacity: closeup ? 0 : 1,
            transition: 'transform 1.5s ease-in-out, opacity 500ms ease-in-out',
            transformOrigin: 'center center',
          }}
        />

        {/* Right Curtain */}
        <img
          src={ASSETS.curtainRight}
          alt="Curtain Right"
          role={phase === 'unzoomed' || phase === 'zoomed' ? 'button' : undefined}
          tabIndex={phase === 'unzoomed' || phase === 'zoomed' ? 0 : -1}
          onClick={handleCurtainActivate}
          onKeyDown={handleCurtainKey}
          style={{
            position: 'absolute',
            right: !visualZoomOn
              ? layout.curtains.right.sideOffsetDefault
              : layout.curtains.right.sideOffsetZoomed,
            top: layout.curtains.right.top,
            width: layout.curtains.right.width,
            height: layout.curtains.right.height,
            objectFit: 'cover',
            zIndex: 250,
            cursor: phase === 'zooming' ? 'default' : 'pointer',
            pointerEvents: phase === 'zooming' ? 'none' : 'auto',
            transform: visualZoomOn
              ? `translate(${layout.curtains.right.translateX}, 0%) scale(${layout.curtains.right.scaleX}, ${layout.curtains.right.scaleY})`
              : 'translate(0, 0) scale(1, 1)',
            transition: 'transform 1.5s ease-in-out',
            transformOrigin: 'left center',
          }}
        />
      </div>
    </div>
  );
}

export default memo(Stage);
