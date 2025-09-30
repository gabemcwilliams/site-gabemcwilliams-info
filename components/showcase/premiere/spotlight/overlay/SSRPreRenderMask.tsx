// components/showcase/premiere/spotlight/overlay/SSRPreRenderMask.tsx
import React from 'react';

export default function SSRPreRenderMask({
  cx, cy, r, color = '#201e1f', zIndex = 1995, // above overlay wrapper (1988)
}: { cx: number; cy: number; r: number; color?: string; zIndex?: number }) {
  return (
    <div
      id="premiere-ssr-mask"
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: color,
        maskImage: `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, black ${r}px)`,
        WebkitMaskImage: `radial-gradient(circle at ${cx}px ${cy}px, transparent ${r}px, black ${r}px)`,
        maskRepeat: 'no-repeat',
        maskSize: '100% 100%',
        pointerEvents: 'none',
        opacity: 1,
        transition: 'opacity 220ms ease',
      }}
    />
  );
}
