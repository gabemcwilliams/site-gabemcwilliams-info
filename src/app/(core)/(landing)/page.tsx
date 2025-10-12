'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWarmPremiereAssets } from '@/hooks/core/landing/useWarmPremiereAssets';
import LandingBall from '@/components/core/landing/LandingBall';

export default function LandingPage() {
  const dotRef = useRef<SVGSVGElement | null>(null);
  const spanRef = useRef<HTMLSpanElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  const [ballVersion, setBallVersion] = useState(0);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    let lastW = -1, lastH = -1;
    let t: number | undefined;

    const bump = (w: number, h: number) => {
      const changed = Math.abs(w - lastW) >= 8 || Math.abs(h - lastH) >= 8;
      if (!changed) return;
      lastW = w; lastH = h;
      if (t) window.clearTimeout(t);
      t = window.setTimeout(() => setBallVersion(v => v + 1), 200);
    };

    const seed = el.getBoundingClientRect();
    lastW = Math.round(seed.width);
    lastH = Math.round(seed.height);

    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect;
      if (cr) bump(Math.round(cr.width), Math.round(cr.height));
    });

    ro.observe(el);
    return () => {
      ro.disconnect();
      if (t) window.clearTimeout(t);
    };
  }, []);

  useWarmPremiereAssets('/api/v1/premiere-manifest');

  return (
    <main
      ref={mainRef}
      style={{ zIndex: 500, height: '33vh' }}
      className="
        flex-grow min-h-0 h-full
        bg-[var(--background)] text-[var(--TEXT_PRIMARY)]
        flex justify-start relative
        /* spacing: small by default, larger on lg+ */
        pl-6 pr-4 pt-8
        lg:px-[8rem] lg:pt-[6rem]
      "
    >
      <div className="max-w-screen-md relative">
        <h1
          className="
            font-bold leading-tight
            text-[2.5rem] sm:text-[3rem] lg:text-[4rem]
          "
        >
          Experiment
          <span aria-hidden className="inline lg:hidden align-baseline font-bold">.</span>
          <span
            ref={spanRef}
            aria-hidden
            className="hidden lg:inline-block w-[0.5ch] h-[1em] align-baseline text-transparent translate-y-[0.47em] select-none"
          >
            .
          </span>
          <br />Build.<br />Predict.
        </h1>
      </div>

      <LandingBall
        ballVersion={ballVersion}
        /* if you still need a boolean, infer via CSS in the child,
           or pass widthOK={true} and let CSS clamp sizes */
        widthOK={true}
        dotRef={dotRef}
        spanRef={spanRef}
        mainRef={mainRef}
      />
    </main>
  );
}
