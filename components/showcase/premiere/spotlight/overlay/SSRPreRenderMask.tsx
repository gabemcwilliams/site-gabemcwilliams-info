import React from 'react';

export default function SSRPreRenderMask({
  cx,
  cy,
  r,
  color = '#201e1f',
  zIndex = 1995, // above your live overlay wrapper (1988), below the logo
}: {
  cx: number;
  cy: number;
  r: number;
  color?: string;
  zIndex?: number;
}) {
  return (
    <div
      id="premiere-ssr-mask"
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: color,
        // Pixel coords → deterministic on the server
        maskImage: `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, black ${r}px)`,
        WebkitMaskImage: `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, black ${r}px)`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',
        pointerEvents: 'none',
        opacity: 1,                         // visible at first paint
        transition: 'opacity 220ms ease',   // will animate when we add html.mask-ready
      }}
    />
  );
}
