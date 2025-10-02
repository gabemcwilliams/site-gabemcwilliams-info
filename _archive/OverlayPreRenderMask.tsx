// components/showcase/premiere/spotlight/overlay/OverlayPreRenderMask.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Props = {
  show: boolean;           // true until real mask is ready
  fadeMs?: number;
  color?: string;          // must match live scrim color
  zIndex?: number;         // below logo, above stage
};

export default function OverlayPreRenderMask({
  show,
  fadeMs = 220,
  color = '#201e1f',
  zIndex = 1987,
}: Props) {
  const params = useSearchParams();

  // Always call hooks; no early returns
  const [cx, setCx] = useState(0);
  const [cy, setCy] = useState(0);
  const [r,  setR ] = useState(150);
  const [armed, setArmed] = useState(false);   // arm transitions after first paint
  const [render, setRender] = useState(show);  // unmount after fade

  // Read URL + viewport AFTER mount (client-only)
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const cxPx = Number(params.get('cx')) || w / 2;
    const cyPx = Number(params.get('cy')) || h / 2;
    const rPx  = Number(params.get('r'))  || 150;
    setCx(Math.round(cxPx));
    setCy(Math.round(cyPx));
    setR (Math.round(rPx));
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [params]);

  // Convert to CSS vars (position as %, radius as px)
  const vars = useMemo(() => {
    const w = Math.max(1, window.innerWidth);
    const h = Math.max(1, window.innerHeight);
    return {
      '--cxp': `${(cx / w) * 100}%`,
      '--cyp': `${(cy / h) * 100}%`,
      '--rpx': `${r}px`,
    } as React.CSSProperties;
  }, [cx, cy, r]);

  // Unmount after fade when show -> false
  useEffect(() => {
    if (show) setRender(true);
    else {
      const id = setTimeout(() => setRender(false), fadeMs);
      return () => clearTimeout(id);
    }
  }, [show, fadeMs]);

  if (!render) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex,
        background: color,
        // circular transparent hole at (--cxp, --cyp) with radius --rpx
        maskImage: `radial-gradient(circle at var(--cxp) var(--cyp), transparent var(--rpx), black var(--rpx))`,
        WebkitMaskImage: `radial-gradient(circle at var(--cxp) var(--cyp), transparent var(--rpx), black var(--rpx))`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskSize: '100% 100%',
        WebkitMaskSize: '100% 100%',

        pointerEvents: 'none',
        opacity: show ? 1 : 0,
        transition: armed ? `opacity ${fadeMs}ms ease` : 'none',
        willChange: 'opacity',

        ...vars,
      }}
    />
  );
}
