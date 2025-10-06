'use client';

import React, {useEffect, useRef, useState} from 'react';
import {useViewportGate} from '@/states/core/useViewportGate';
import {useWarmPremiereAssets} from "@/hooks/core/landing/useWarmPremiereAssets";
import LandingBall from "@/components/core/landing/LandingBall";

const MIN_BALL_WIDTH = 1024;

export default function LandingPage() {
    const dotRef = useRef<SVGSVGElement | null>(null);
    const spanRef = useRef<HTMLSpanElement | null>(null);
    const mainRef = useRef<HTMLElement | null>(null);

    const setWidthOK = useViewportGate(s => s.setWidthOK);
    const widthOK = useViewportGate(s => s.widthOK);

    // compact when under the MIN_BALL_WIDTH (<= 1024)
    const compact = !widthOK;

    const [ballVersion, setBallVersion] = useState(0);

    // Gate on window width (stable)
    useEffect(() => {
        const onResize = () => setWidthOK(window.innerWidth >= MIN_BALL_WIDTH);
        onResize();
        window.addEventListener('resize', onResize, {passive: true});
        return () => window.removeEventListener('resize', onResize);
    }, [setWidthOK]);

    // Remount ball when container changes size (with threshold + debounce)
    useEffect(() => {
        if (!mainRef.current) return;

        let lastW = -1, lastH = -1;
        let t: number | undefined;

        const bump = (w: number, h: number) => {
            // change threshold to avoid flapping on sub-pixel/layout jitter
            const changed = Math.abs(w - lastW) >= 8 || Math.abs(h - lastH) >= 8;
            if (!changed) return;
            lastW = w;
            lastH = h;
            if (t) window.clearTimeout(t);
            t = window.setTimeout(() => setBallVersion(v => v + 1), 200); // debounce
        };

        const ro = new ResizeObserver(entries => {
            const cr = entries[0]?.contentRect;
            if (!cr) return;
            bump(Math.round(cr.width), Math.round(cr.height));
        });

        // seed once
        const seed = mainRef.current.getBoundingClientRect();
        lastW = Math.round(seed.width);
        lastH = Math.round(seed.height);

        ro.observe(mainRef.current);
        return () => {
            ro.disconnect();
            if (t) window.clearTimeout(t);
        };
    }, []);

    useWarmPremiereAssets('/api/v1/premiere-manifest');

    return (
        <main
            ref={mainRef}
            style={{zIndex: 500, height: '33vh'}}
            className={`flex-grow min-h-0 h-full bg-[var(--background)] text-[var(--TEXT_PRIMARY)] flex justify-start relative
        ${compact ? 'pl-6 pr-4 pt-8' : 'px-[8rem] pt-[6rem]'}
      `}
        >
            <div className="max-w-screen-md relative">
                <h1
                    className={`font-bold leading-tight
            ${compact ? 'text-[2.5rem] sm:text-[3rem]' : 'text-[4rem]'}
          `}
                >
                    Experiment
                    <span aria-hidden="true" className="inline lg:hidden align-baseline font-bold">.</span>
                    <span
                        ref={spanRef}
                        aria-hidden="true"
                        className="hidden lg:inline-block w-[0.5ch] h-[1em] align-baseline text-transparent translate-y-[0.47em] select-none"
                    >.</span>
                    <br/>Build.<br/>Predict.
                </h1>
            </div>

            <LandingBall
                ballVersion={ballVersion}
                widthOK={widthOK}
                dotRef={dotRef}
                spanRef={spanRef}
                mainRef={mainRef}
            />
        </main>
    );
}
