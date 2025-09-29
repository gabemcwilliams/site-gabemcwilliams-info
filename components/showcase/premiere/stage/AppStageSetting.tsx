'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';

// === Stage Components ===
import Sky from '@/components/showcase/premiere/stage/sky/Sky';
import Moon from '@/components/showcase/premiere/stage/sky/Moon';
import Clouds from '@/components/showcase/premiere/stage/sky/Clouds';
import Cacti from '@/components/showcase/premiere/stage/ground/Cacti';
import Grass from '@/components/showcase/premiere/stage/ground/Grass';
import Rocks from '@/components/showcase/premiere/stage/ground/Rocks';
import Ground from '@/components/showcase/premiere/stage/ground/Ground';
import Stage from '@/components/showcase/premiere/stage/foreground/Stage';
import Campfire from '@/components/showcase/premiere/stage/foreground/Campfire';
import Audience from '@/components/showcase/premiere/stage/foreground/Audience';

// === Overlay Components ===
import FullscreenFadeCover from '@/components/showcase/premiere/spotlight/overlay/FullScreenFadeCover';

// === Background layout type ===
interface BGLayoutParams {
    starsTop: string;
    starsHeight: string;
    gradientTop: string;
    gradientHeight: string;
}

export default function AppStageSetting() {
    const rootRef = useRef<HTMLDivElement | null>(null);

    // Single source of truth for the whole sequence
    const [curtainsOpen, setCurtainsOpen] = useState(false);

    // Reduced motion
    const [prefersReduced, setPrefersReduced] = useState(false);

    function reducedMotionEffect() {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        if (!mq) return;
        setPrefersReduced(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
        mq.addEventListener?.('change', onChange);
        return () => mq.removeEventListener?.('change', onChange);
    }

    useEffect(reducedMotionEffect, []);

    // Background layout (responsive bands)
    const [bgLayout, setBgLayout] = useState<BGLayoutParams>({
        starsTop: '0vh',
        starsHeight: '33vh',
        gradientTop: '33vh',
        gradientHeight: '67vh',
    });

    function backgroundLayoutEffect() {
        const updateLayout = () => {
            const vw = window.innerWidth;
            if (vw < 600) {
                setBgLayout({starsTop: '0vh', starsHeight: '30vh', gradientTop: '30vh', gradientHeight: '70vh'});
            } else if (vw <= 1980) {
                setBgLayout({starsTop: '0vh', starsHeight: '40vh', gradientTop: '40vh', gradientHeight: '60vh'});
            } else {
                setBgLayout({starsTop: '0vh', starsHeight: '35vh', gradientTop: '35vh', gradientHeight: '65vh'});
            }
        };
        updateLayout();
        window.addEventListener('resize', updateLayout);
        return () => window.removeEventListener('resize', updateLayout);
    }

    useEffect(backgroundLayoutEffect, []);

    // Curtains zoom transform (only applied once curtainsOpen is true)
    const transformStyle = useMemo(() => {
        if (prefersReduced) return 'none';
        return curtainsOpen ? 'translateY(-1.5vh) scale(1.06)' : 'none';
    }, [curtainsOpen, prefersReduced]);

    // Underlay (dark gradient under curtains during zoom)
    const underlayStyle: React.CSSProperties = {
        position: 'absolute',
        inset: 0,
        zIndex: curtainsOpen ? 999 : -1, // curtains will sit at 1000
        opacity: curtainsOpen ? 1 : 0,
        pointerEvents: 'none',
        transition: 'opacity 500ms ease',
        background: 'radial-gradient(60% 60% at 50% 60%, rgba(0,0,0,0.15), rgba(0,0,0,0.75))',
    };

    // === Click handler passed down to Stage ===
    function startZoom() {
        if (prefersReduced) return;
        requestAnimationFrame(() => setCurtainsOpen(true));
    }

    // Mount/unmount logging
    const didInit = useRef(false);

    function stageInitEffect() {
        if (didInit.current) return;
        didInit.current = true;

        if (typeof window !== 'undefined') {
            (window as any)._stageSettingSvgCount = ((window as any)._stageSettingSvgCount ?? 0) + 1;
            console.log('svg instances:', (window as any)._stageSettingSvgCount);
        }
        console.log('[stageSetting] mount');

        return () => {
            console.log('[stageSetting] unmount');
        };
    }

    useEffect(stageInitEffect, []);

    // Body user-select toggle on mouse down/up
    function handleMouseDown() {
        document.body.style.userSelect = 'none';
    }

    function handleMouseUp() {
        document.body.style.userSelect = 'auto';
    }

    function bodyUserSelectEffect() {
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }

    useEffect(bodyUserSelectEffect, []);

    return (
        <div
            ref={rootRef}
            data-stage-root
            data-curtains-closeup={curtainsOpen ? 'true' : 'false'}
            style={{
                position: 'fixed',
                inset: 0,
                overflow: 'hidden',
                isolation: 'isolate',
            }}
        >
            {/* OVERLAY */}
<FullscreenFadeCover
  color="linear-gradient(to bottom, black 1%, #623516 100%)"
  visibleTimer={.05}   // hold for 5 seconds
  fadeTimer={.5}      // no fade
/>


            {/* UNDERLAY */}
            <div aria-hidden style={underlayStyle}/>

            {/* CURTAINS (the only element that zooms) */}
            <div
                data-layer="curtains"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: curtainsOpen ? 1000 : 30, // keep clickable on top until opened
                    transform: prefersReduced || !curtainsOpen ? 'none' : transformStyle,
                    transformOrigin: 'center 65%',
                    transition: prefersReduced ? 'none' : 'transform 900ms cubic-bezier(.22,.61,.36,1)',
                    willChange: 'transform',
                }}
            >
                <Stage
                    zoom={curtainsOpen}
                    closeup={curtainsOpen}
                    onCurtainClick={startZoom}
                />

            </div>

            {/* CAMPFIRE */}
            <div
                data-layer="campfire"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 40,
                    pointerEvents: 'none',
                    opacity: curtainsOpen ? 0 : 1,
                    transition: 'opacity 500ms ease',
                }}
            >
                <Campfire/>
            </div>

            {/* AUDIENCE */}
            <div
                data-layer="audience"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 50,
                    pointerEvents: curtainsOpen ? 'none' : 'auto',
                    opacity: curtainsOpen ? 0 : 1,
                    transition: 'opacity 500ms ease',
                }}
            >
                <Audience visible zoom={curtainsOpen}/>
            </div>

            {/* SCENERY */}
            <div
                data-layer="scenery"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 60,
                    pointerEvents: curtainsOpen ? 'none' : 'auto',
                    opacity: curtainsOpen ? 0 : 1,
                    transition: 'opacity 500ms ease',
                }}
            >
                <Grass/>
                <Cacti/>
                <Rocks/>
            </div>

            {/* SKY BAND */}
            <div
                data-layer="skyband"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0,
                    opacity: curtainsOpen ? 0 : 1,
                    pointerEvents: 'none',
                    transition: 'opacity 500ms ease',
                }}
            >
                <Sky height={bgLayout.starsHeight} zIndex={0}/>
                <Moon size="7vh" verticalRangeVh={{min: 5, max: 17}} side="random" phase={0.65} waxing/>
                <Clouds height={bgLayout.starsHeight} zIndex={1}/>
            </div>

            {/* GROUND BAND */}
            <div
                data-layer="groundband"
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 10,
                    opacity: curtainsOpen ? 0 : 1,
                    pointerEvents: 'none',
                    transition: 'opacity 500ms ease',
                }}
            >
                <Ground top={bgLayout.gradientTop} height={bgLayout.gradientHeight} zIndex={0} from="black"
                        to="#623516"/>
                <div
                    style={{
                        position: 'absolute',
                        top: bgLayout.gradientTop,
                        height: bgLayout.gradientHeight,
                        width: '100%',
                        background: 'linear-gradient(to bottom, black, #623516)',
                        zIndex: 0,
                    }}
                />
            </div>

            {/* CSS helper for blur effect on non-curtains */}
            <style jsx>{`
                /* While curtains are open, blur background */
                [data-curtains-closeup='true'] :global([data-layer]:not([data-layer='curtains'])) {
                    filter: blur(0px);
                }

                /* By default, only the Stage (curtains+emblem) should accept clicks */
                :global([data-layer]:not([data-layer='curtains'])) {
                    pointer-events: none !important;
                }
            `}</style>
        </div>
    );
}
