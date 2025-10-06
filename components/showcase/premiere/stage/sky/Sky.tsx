'use client';

import React from 'react';

export interface SkyProps {
  height?: string; // how tall the sky band is
  zIndex?: number;
}

export default function Sky({ height = '40vh', zIndex = 0 }: SkyProps) {
  return (
    <>
      <style>{`
        @keyframes twinkle-scroll {
          from { transform: translate3d(0,0,0); }
          to   { transform: translate3d(-1000px,0,0); }
        }
        .sky-wrap {
          position: absolute;
          top: 0; left: 0;
          width: 100vw;
          height: var(--sky-h);
          overflow: hidden;
          z-index: var(--z);
          pointer-events: none;
          background: black;
        }
        .sky-stars {
          background: black url('/assets/showcase/premiere/stage_setting/sky/stars.png') repeat;
          position: absolute; inset: 0;
        }
        .sky-twinkle {
          width: 10000px; height: 100%;
          background: transparent url('/assets/showcase/premiere/stage_setting/sky/twinkling.png') repeat;
          background-size: 1000px 1000px;
          position: absolute; top: 0; left: 0;
          animation: twinkle-scroll 70s linear infinite;
          mix-blend-mode: screen; /* optional: nicer sparkle */
          opacity: .8;
        }
      `}</style>

      <div className="sky-wrap" style={{ ['--sky-h' as never]: height, ['--z' as never]: zIndex }}>
        <div className="sky-stars" />
        <div className="sky-twinkle" />
      </div>
    </>
  );
}
