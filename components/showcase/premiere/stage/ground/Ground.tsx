'use client';

import React, { memo } from 'react';

export interface GroundProps {
  top?: string;     // where the ground band starts relative to viewport top
  height?: string;  // height of the gradient band
  zIndex?: number;
  from?: string;    // gradient start color
  to?: string;      // gradient end color
  grainOpacity?: number; // optional: control texture intensity
}

function Ground({
  top = '40vh',
  height = '60vh',
  zIndex = 0,
  from = 'black',
  to = '#623516',
  grainOpacity = 0.1, // start subtle
}: GroundProps) {
  return (
    <div
      aria-hidden="true"
      id="bg-grd-styled-gradient"
      style={{
        position: 'absolute',
        left: 0,
        width: '100vw',
        top,
        height,
        background: `linear-gradient(to bottom, ${from}, ${to})`,
        zIndex,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
    {/*  /!* grain overlay *!/*/}
    {/*  <div*/}
    {/*    style={{*/}
    {/*      position: 'absolute',*/}
    {/*      inset: 0,*/}
    {/*      backgroundImage: 'url("/textures/ground/gravelly_sand.webp")', // no "public/"*/}
    {/*      backgroundRepeat: 'repeat',*/}
    {/*      backgroundSize: '1600px 1600px', // larger = less noise*/}
    {/*      opacity: grainOpacity,*/}
    {/*      mixBlendMode: 'soft-light', // gentler than overlay*/}
    {/*      filter: 'saturate(0) brightness(0.85) contrast(1.05)',*/}
    {/*      pointerEvents: 'none',*/}
    {/*    }}*/}
    {/*  />*/}
    </div>
  );
}


export default memo(Ground);
