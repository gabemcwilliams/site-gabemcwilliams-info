'use client';

import React, { memo, useEffect, useMemo, useState } from 'react';

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;

export type CloudLayer = {
  img: string;
  loopDurationSec: number;
  z: number;
  opacity: number;
  height: string; // '21vh' etc.
};

export interface CloudsProps {
  height?: string;   // total band height (usually same as Sky)
  zIndex?: number;
  layers?: CloudLayer[];
}

const defaultLayers: CloudLayer[] = [
  { img: '/assets/showcase/premiere/clouds/streams/cloud_stream_far.svg',    loopDurationSec: 260, z: 51, opacity: 1, height: '5vh'  },
  { img: '/assets/showcase/premiere/clouds/streams/cloud_stream_medium.svg', loopDurationSec:  220, z: 52, opacity: 1, height: '10vh' },
  { img: '/assets/showcase/premiere/clouds/streams/cloud_stream_near.svg',   loopDurationSec:  120, z: 53, opacity: 1, height: '15vh' },
];

function parseVhToPx(vhString: string) {
  const m = vhString.match(/^([\d.]+)vh$/i);
  const vh = m ? parseFloat(m[1]) : 0;
  return (vh / 100) * window.innerHeight;
}

function useTileWidthPx(imgSrc: string, layerVh: string) {
  const [tileW, setTileW] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (!alive) return;
      const natW = img.naturalWidth || 0;
      const natH = img.naturalHeight || 1;
      const targetHpx = parseVhToPx(layerVh);
      const scale = targetHpx / natH;
      const displayW = natW * scale;
      setTileW(displayW);
    };
    img.src = imgSrc;
    return () => { alive = false; };
  }, [imgSrc, layerVh]);

  useEffect(() => {
    const onResize = () => setTileW(null);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return tileW;
}

function CloudBand({ layer }: { layer: CloudLayer }) {
  const tileW = useTileWidthPx(layer.img, layer.height);

  const trackStyle: CSSVars = useMemo(() => {
    const base: CSSVars = {
      '--opacity': layer.opacity,
      '--z': layer.z,
      '--h': layer.height,
      animationName: 'cloud-track-move',
      animationTimingFunction: 'linear',
      animationIterationCount: 'infinite',
      animationDuration: `${layer.loopDurationSec}s`,
      animationDelay: `-${Math.random() * 5}s`,
    };
    if (tileW != null) {
      base['--tileW'] = `${Math.round(tileW)}px`;
    }
    return base;
  }, [layer.opacity, layer.z, layer.height, layer.loopDurationSec, tileW]);

  const tileStyle: CSSVars = useMemo(
    () => ({
      backgroundImage: `url(${layer.img})`,
      backgroundSize: `auto ${layer.height}`,
    }),
    [layer.img, layer.height]
  );

  if (tileW == null) return null;

  return (
    <div className="cloud-track" style={trackStyle}>
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
  return (
    <>
      <style>{`
        /* We’ll move the track exactly one displayed tile width: var(--tileW) */
        @keyframes cloud-track-move {
          from { transform: translateX(0); }
          to   { transform: translateX(calc(-1 * var(--tileW))); }
          /* ↑ if you want right-to-left, keep it negative.
             For left-to-right, use translateX(var(--tileW)) and reverse tile order. */
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
        className="clouds-wrap"
        style={{
          ['--clouds-h' as unknown as `--${string}`]: height,
          ['--clouds-z' as unknown as `--${string}`]: zIndex,
        }}
        aria-hidden="true"
      >
        {layers.map((layer, i) => (
          <CloudBandMemo key={i} layer={layer} />
        ))}
      </div>
    </>
  );
}
