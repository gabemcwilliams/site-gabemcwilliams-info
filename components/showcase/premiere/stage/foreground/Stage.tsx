'use client';

import React, {
  memo,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type CSSProperties,
} from 'react';
import { useRouter } from 'next/navigation';

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

export interface StageProps {
  zoom?: boolean;
  closeup?: boolean;
  onCurtainClick?: () => void;
  onEmblemClick?: () => void;
  zIndex?: number;
}

/* =========================
   Constants
   ========================= */
const ASSETS = {
  arch: '/assets/showcase/premiere/stage/stage_arch_main.svg',
  emblem: '/assets/showcase/premiere/stage/stage_arch_emblem_default.svg',
  emblemHighlighted: '/assets/showcase/premiere/stage/stage_arch_emblem_highlighted.svg',
  curtainLeft: '/assets/showcase/premiere/stage/stage_curtain_left.svg',
  curtainRight: '/assets/showcase/premiere/stage/stage_curtain_right.svg',
  frame: '/assets/showcase/premiere/stage/stage_frame_full.svg',
} as const;

const BP_SMALL = 600;
const BP_LARGE = 1980;

/* =========================
   Pure helpers
   ========================= */
function computeCurtains(vw: number): { left: CurtainParams; right: CurtainParams } {
  const base = {
    sideOffsetDefault: '3%',
    sideOffsetZoomed: '8%',
    top: '11%',
    width: '47%',
    height: '70%',
    translateXMag: '0%',
    scaleX: 1,
    scaleY: 1,
  };

  if (vw <= BP_LARGE && vw >= BP_SMALL) {
    base.sideOffsetZoomed = '19%';
    base.height = '80%';
    base.translateXMag = '33%';
    base.scaleX = 2.8;
    base.scaleY = 3;
  } else if (vw > BP_LARGE) {
    base.sideOffsetZoomed = '52%';
    base.height = '80%';
    base.translateXMag = '100%';
    base.scaleX = 4;
    base.scaleY = 3;
  }

  return {
    left: {
      sideOffsetDefault: base.sideOffsetDefault,
      sideOffsetZoomed: base.sideOffsetZoomed,
      top: base.top,
      width: base.width,
      height: base.height,
      translateX: `-${base.translateXMag}`,
      scaleX: base.scaleX,
      scaleY: base.scaleY,
    },
    right: {
      sideOffsetDefault: base.sideOffsetDefault,
      sideOffsetZoomed: base.sideOffsetZoomed,
      top: base.top,
      width: base.width,
      height: base.height,
      translateX: base.translateXMag,
      scaleX: base.scaleX,
      scaleY: base.scaleY,
    },
  };
}

function computeArchStyle(vw: number): { top: string; width: string; height: string } {
  if (vw < BP_SMALL) return { top: '-8%', width: '85%', height: '65%' };
  if (vw <= BP_LARGE) return { top: '16%', width: '55%', height: '85%' };
  return { top: '15.5%', width: '28%', height: '95%' };
}

function computeEmblemStyle(vw: number): { top: string; width: string } {
  if (vw < BP_SMALL) return { top: '19%', width: '6%' };
  if (vw <= BP_LARGE) return { top: '19.5%', width: '5%' };
  return { top: '20%', width: '2.5%' };
}

/* =========================
   Custom hooks (minimal)
   ========================= */
function useViewportWidth(initial = 1200) {
  const [vw, setVw] = useState<number>(initial);

  function resizeEffect() {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }

  useEffect(resizeEffect, []);
  return vw;
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
   Component
   ========================= */
function Stage({
  zoom,
  closeup = false,
  onCurtainClick,
  onEmblemClick,
  zIndex = 2,
}: StageProps) {
  const vw = useViewportWidth(1200);
  const [hover, setHover] = useState(false);
  const { phase, isZoomed, handleCurtainActivate, handleCurtainKey } =
    useCurtainNavigation(onCurtainClick);

  const { left, right } = useMemo(() => computeCurtains(vw), [vw]);
  const archStyle = useMemo(() => computeArchStyle(vw), [vw]);
  const emblemStyle = useMemo(() => computeEmblemStyle(vw), [vw]);

  const rootStyle = useMemo<CSSProperties>(
    () => ({
      position: 'absolute',
      inset: 0,
      zIndex,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: '20vh',
      paddingBottom: '20vh',
      backgroundColor: 'transparent',
      overflow: 'hidden',
      cursor: 'default',
    }),
    [zIndex]
  );

  const innerStyle = useMemo<CSSProperties>(
    () => ({
      position: 'relative',
      height: '70%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    []
  );

  const visualZoomOn = Boolean(zoom) || isZoomed;
  const sharedZoom = visualZoomOn ? 'scale(3.5)' : 'scale(1)';

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
      {/* ARCH */}
      <img
        src={ASSETS.arch}
        alt="Stage Arch"
        style={{
          position: 'absolute',
          top: archStyle.top,
          width: archStyle.width,
          height: 'auto',
          left: '50%',
          transform: 'translateX(-50%)',
          transformOrigin: 'center top',
          zIndex: 400,
          pointerEvents: 'none',
          opacity: closeup ? 0 : 1,
          transition: 'opacity 240ms ease',
        }}
      />

      {/* EMBLEM */}
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
          top: emblemStyle.top,
          left: '50%',
          width: emblemStyle.width,
          transform: 'translateX(-50%)',
          transformOrigin: 'center top',
          zIndex: 410,
          opacity: closeup ? 0 : 1,
          pointerEvents: closeup ? 'none' : 'auto',
          cursor: closeup ? 'default' : 'pointer',
          transition: 'opacity 240ms ease',
        }}
      />

      <div style={innerStyle}>
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
            left: !visualZoomOn ? left.sideOffsetDefault : left.sideOffsetZoomed,
            top: left.top,
            width: left.width,
            height: left.height,
            objectFit: 'cover',
            zIndex: 250,
            cursor: phase === 'zooming' ? 'default' : 'pointer',
            pointerEvents: phase === 'zooming' ? 'none' : 'auto',
            transform: visualZoomOn
              ? `translate(${left.translateX}, 0%) scale(${left.scaleX}, ${left.scaleY})`
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
            height: '100%',
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
            right: !visualZoomOn ? right.sideOffsetDefault : right.sideOffsetZoomed,
            top: right.top,
            width: right.width,
            height: right.height,
            objectFit: 'cover',
            zIndex: 250,
            cursor: phase === 'zooming' ? 'default' : 'pointer',
            pointerEvents: phase === 'zooming' ? 'none' : 'auto',
            transform: visualZoomOn
              ? `translate(${right.translateX}, 0%) scale(${right.scaleX}, ${right.scaleY})`
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
