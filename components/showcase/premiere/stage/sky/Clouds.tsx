'use client';

import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

export type CloudLayer = {
  img: string;
  loopDurationSec: number;
  z: number;
  opacity: number;
  height: string; // '21vh' etc.
  filter?: string;
};

export interface CloudsProps {
  height?: string;   // total band height
  zIndex?: number;
  layers?: CloudLayer[];
}

const defaultLayers: CloudLayer[] = [
  {
    img: '/assets/showcase/premiere/stage_setting/clouds/streams/cloud_stream_far.svg',
    loopDurationSec: 260, z: 51, opacity: 0.90, height: '5vh',
    filter: 'grayscale(55%) saturate(0.85) contrast(0.92)',
  },
  {
    img: '/assets/showcase/premiere/stage_setting/clouds/streams/cloud_stream_medium.svg',
    loopDurationSec: 220, z: 52, opacity: 0.75, height: '10vh',
    filter: 'grayscale(45%) saturate(0.90) contrast(0.95)',
  },
  {
    img: '/assets/showcase/premiere/stage_setting/clouds/streams/cloud_stream_near.svg',
    loopDurationSec: 120, z: 53, opacity: 0.60, height: '15vh',
    filter: 'grayscale(35%) saturate(0.95) contrast(0.98)',
  },
];

// ---------- utils / hooks ----------
function parseVhToPx(vhString: string) {
  const m = vhString.match(/^([\d.]+)vh$/i);
  const vh = m ? parseFloat(m[1]) : 0;
  return (vh / 100) * (globalThis?.visualViewport?.height ?? window.innerHeight);
}

function useResizeEpoch(observedEl?: HTMLElement | null) {
  const [epoch, setEpoch] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Window resize
  useEffect(() => {
    const onResize = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setEpoch((e) => e + 1));
    };
    window.addEventListener('resize', onResize);
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener?.('change', onResize); // DPR changes
    return () => {
      window.removeEventListener('resize', onResize);
      mq.removeEventListener?.('change', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Container resize (more robust than window-only)
  useEffect(() => {
    if (!observedEl) return;
    const ro = new ResizeObserver(() => setEpoch((e) => e + 1));
    ro.observe(observedEl);
    return () => ro.disconnect();
  }, [observedEl]);

  return epoch;
}

/**
 * Computes displayed tile width in px for a given image + target vh height.
 * Caches natural sizes; on resizeEpoch, recomputes from cached natW/natH.
 */
function useTileWidthPx(imgSrc: string, layerVh: string, resizeEpoch: number) {
  const [tileW, setTileW] = useState<number | null>(null);
  const natWRef = useRef<number>(0);
  const natHRef = useRef<number>(1);

  const computeFromNat = useCallback(() => {
    const targetHpx = parseVhToPx(layerVh);
    const displayW = (natWRef.current * targetHpx) / natHRef.current;
    setTileW(displayW);
  }, [layerVh]);

  // Load natural size once per imgSrc
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      natWRef.current = img.naturalWidth || 0;
      natHRef.current = img.naturalHeight || 1;
      computeFromNat();
    };
    img.src = imgSrc;
    return () => { alive = false; };
  }, [imgSrc, computeFromNat]);

  // Recompute on epoch bump (window/container resize, DPR change), or vh change
  useEffect(() => {
    if (natWRef.current && natHRef.current) {
      computeFromNat();
    }
  }, [computeFromNat, resizeEpoch, layerVh]);

  return tileW;
}

// ---------- components ----------
function CloudBand({ layer, resizeEpoch }: { layer: CloudLayer; resizeEpoch: number }) {
  const tileW = useTileWidthPx(layer.img, layer.height, resizeEpoch);

  const trackStyle: CSSVars = useMemo(() => {
    const base: CSSVars = {
      '--opacity': layer.opacity,
      '--z': layer.z,
      '--h': layer.height,
      '--filter': layer.filter ?? 'none',
      animationName: 'cloud-track-move',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
      animationDuration: `${layer.loopDurationSec}s`,
      animationDelay: `-${Math.random() * 5}s`,
    };
    if (tileW != null) base['--tileW'] = `${Math.round(tileW)}px`;
    return base;
  }, [layer.opacity, layer.z, layer.height, layer.loopDurationSec, layer.filter, tileW]);

  const tileStyle: CSSVars = useMemo(
    () => ({
      backgroundImage: `url(${layer.img})`,
      backgroundSize: `auto ${layer.height}`,
    }),
    [layer.img, layer.height]
  );

  if (tileW == null) return null;

  // key forces remount on resizeEpoch to restart keyframes cleanly
  return (
    <div className="cloud-track" style={trackStyle} key={`${layer.img}-${resizeEpoch}`}>
      <div className="cloud-tile" style={tileStyle} />
      <div className="cloud-tile" style={tileStyle} />
    </div>
  );
}

const CloudBandMemo = memo(CloudBand);

export default function Clouds({
  height = '40vh',
  zIndex = 0,
  layers = defaultLayers,
}: CloudsProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const resizeEpoch = useResizeEpoch(wrapRef.current);

  return (
    <>
      <style>{`
        @keyframes cloud-track-move {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-1 * var(--tileW))); }
        }

        .clouds-wrap {
          position: absolute;
          top: 0; left: 0;
          width: 100vw;
          height: var(--clouds-h);
          overflow: hidden;
          z-index: var(--clouds-z);
          pointer-events: none;
          background: transparent;
        }

        .cloud-track {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          width: calc(var(--tileW) * 2);
          display: flex;
          z-index: var(--z);
          opacity: var(--opacity);
          filter: var(--filter);
          will-change: transform;
        }

        .cloud-tile {
          flex: 0 0 var(--tileW);
          height: 100%;
          background-repeat: repeat-x;
          background-position: 0 0;
          background-size: auto var(--h);
        }
      `}</style>

      <div
        ref={wrapRef}
        className="clouds-wrap"
        style={{
          ['--clouds-h' as any]: height,
          ['--clouds-z' as any]: zIndex,
        }}
        aria-hidden="true"
      >
        {layers.map((layer, i) => (
          <CloudBandMemo key={i} layer={layer} resizeEpoch={resizeEpoch} />
        ))}
      </div>
    </>
  );
}
