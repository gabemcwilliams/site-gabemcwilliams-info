'use client';

import React, {
    memo,
    useEffect,
    useMemo,
    useState,
    useCallback,
    type CSSProperties,
} from 'react';
import {useRouter} from 'next/navigation';

import {useArtifactPlacementStore} from "@/states/showcase/premiere/stage_setting/useArtifactPlacementStore";


// …after you’ve computed everything and called setters:
const api = useArtifactPlacementStore.getState()
api.setDebug(true)            // enable once (e.g., based on env)
api.debugDump('Stage final layout')  // call when you’re done “at the end”


/* =========================
   Types
   ========================= */
interface CurtainParams {
    sideOffsetDefault: string;
    sideOffsetZoomed: string;
    top: string;
    height: string;
    width: string;
    translateX: string;
    scaleX: number;
    scaleY: number;
}

type Layout = {
    stage: {
        innerWidth: string;  // width-driven (e.g., 'min(92vw, 1400px)')
        padTop: string;      // vh
        padBottom: string;   // vh
        zoomScale: number;   // base scale for shared zoom
    };
    emblem: { top: string; width: string };
    curtains: { left: CurtainParams; right: CurtainParams };
};

export interface StageProps {
    zoom?: boolean;
    closeup?: boolean;
    onCurtainClick?: () => void;
    onEmblemClick?: () => void;
    zIndex?: number;
}

/* =========================
   Assets & Breakpoints
   ========================= */
const ASSETS = {
    emblem: '/assets/showcase/premiere/stage_setting/emblem/stage_arch_emblem_base.svg',
    emblemHighlighted: '/assets/showcase/premiere/stage_setting/emblem/stage_arch_emblem_highlighted.svg',
    curtainLeft: '/assets/showcase/premiere/stage_setting/stage/stage_curtain_left.svg',
    curtainRight: '/assets/showcase/premiere/stage_setting/stage/stage_curtain_right.svg',
    frame: '/assets/showcase/premiere/stage_setting/stage/stage_frame_full.svg',
} as const;

// Kept only ≥1024 tiers

const BP_XL = 1280;
const BP_2XL = 1536;

const ASPECT_RATIO = '2000 / 1000'; // adjust to your SVG

/* =========================
   Layout (only lg/xl/2xl)
   ========================= */
function computeLayout(vw: number): Layout {
    // Baseline = lg (≥1024)
    let stage = {
        innerWidth: 'min(92vw, 500px)',
        padTop: '10vh',
        padBottom: '12vh',
        zoomScale: 3.3,
    };

    let emblem = {top: '35.55%', width: '2.4%'};

    // lg baseline curtain values
    let baseCurtain = {
        sideOffsetDefault: '3%',
        sideOffsetZoomed: '20%',
        top: '26%',
        width: '50%',
        height: '64%',
        translateXMag: '16%',
        scaleX: 2.8,
        scaleY: 2.8,
    };

    if (vw >= BP_XL && vw < BP_2XL) {
        // xl (≥1280)
        stage = {innerWidth: 'min(90vw, 600px)', padTop: '8vh', padBottom: '10vh', zoomScale: 3.4};
        emblem = {top: '32.7%', width: '2.4%'};

        baseCurtain = {
            sideOffsetDefault: '3%',
            sideOffsetZoomed: '24%',
            top: '31%',
            width: '48%',
            height: '61%',
            translateXMag: '14%',
            scaleX: 3.0,
            scaleY: 2.9,
        };
    } else if (vw >= BP_2XL) {
        // 2xl (≥1536)
        stage = {innerWidth: 'min(86vw, 900px)', padTop: '0vh', padBottom: '-2vh', zoomScale: 3.5};
        emblem = {top: '19.5%', width: '1.5%'};

        baseCurtain = {
            sideOffsetDefault: '3%',
            sideOffsetZoomed: '30%',
            top: '31%',
            width: '47%',
            height: '61%',
            translateXMag: '10%',
            scaleX: 3.6,
            scaleY: 2.95,
        };
    }

    const curtains = {
        left: {
            sideOffsetDefault: baseCurtain.sideOffsetDefault,
            sideOffsetZoomed: baseCurtain.sideOffsetZoomed,
            top: baseCurtain.top,
            width: baseCurtain.width,
            height: baseCurtain.height,
            translateX: `-${baseCurtain.translateXMag}`,
            scaleX: baseCurtain.scaleX,
            scaleY: baseCurtain.scaleY,
        },
        right: {
            sideOffsetDefault: baseCurtain.sideOffsetDefault,
            sideOffsetZoomed: baseCurtain.sideOffsetZoomed,
            top: baseCurtain.top,
            width: baseCurtain.width,
            height: baseCurtain.height,
            translateX: baseCurtain.translateXMag,
            scaleX: baseCurtain.scaleX,
            scaleY: baseCurtain.scaleY,
        },
    };

    return {stage, emblem, curtains};
}

/* =========================
   Hooks
   ========================= */
function useViewportWidth(initial = 1200) {
    const [vw, setVw] = useState<number>(initial);
    useEffect(() => {
        const onResize = () => setVw(window.innerWidth);
        onResize();
        window.addEventListener('resize', onResize, {passive: true});
        return () => window.removeEventListener('resize', onResize);
    }, []);
    return vw;
}

type ZoomPhase = 'unzoomed' | 'zooming' | 'zoomed' | 'redirecting';

function useCurtainNavigation(onCurtainClick?: () => void) {
    const router = useRouter();
    const [phase, setPhase] = useState<ZoomPhase>('unzoomed');

    const isZoomed = phase === 'zooming' || phase === 'zoomed' || phase === 'redirecting';

    const handleCurtainActivate = useCallback(() => {
        onCurtainClick?.();

        if (phase === 'unzoomed') {
            setPhase('zooming');
            window.setTimeout(() => setPhase('zoomed'), 1500);
            return;
        }

        if (phase === 'zoomed') {
            setPhase('redirecting');
            window.setTimeout(() => router.push('/coming-soon'), 400);
        }
    }, [onCurtainClick, phase, router]);

    const handleCurtainKey: React.KeyboardEventHandler<HTMLImageElement> = useCallback(
        (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCurtainActivate();
            }
        },
        [handleCurtainActivate]
    );

    return {phase, isZoomed, handleCurtainActivate, handleCurtainKey};
}

/* =========================
   Component
   ========================= */
function Stage({
                   zoom,
                   closeup = false,
                   onCurtainClick,
                   onEmblemClick,
                   zIndex = 2,
               }: StageProps) {
    const vw = useViewportWidth(1200);
    const layout = useMemo(() => computeLayout(vw), [vw]);

    const [hover, setHover] = useState(false);
    const {phase, isZoomed, handleCurtainActivate, handleCurtainKey} =
        useCurtainNavigation(onCurtainClick);

    const visualZoomOn = Boolean(zoom) || isZoomed;
    const sharedZoom = visualZoomOn ? `scale(${layout.stage.zoomScale})` : 'scale(1)';

    // right after: const sharedZoom = visualZoomOn ? `scale(${layout.stage.zoomScale})` : 'scale(1)';
    useEffect(() => {
        const api = useArtifactPlacementStore.getState();

        // --- Emblem (final) ---
        api.setEmblem({
            top: layout.emblem.top,
            width: layout.emblem.width,
        });

        // --- Curtains (final) ---
        const leftSideOffset = !visualZoomOn
            ? layout.curtains.left.sideOffsetDefault
            : layout.curtains.left.sideOffsetZoomed;

        const rightSideOffset = !visualZoomOn
            ? layout.curtains.right.sideOffsetDefault
            : layout.curtains.right.sideOffsetZoomed;

        const leftTransform = visualZoomOn
            ? `translate(${layout.curtains.left.translateX}, 0%) scale(${layout.curtains.left.scaleX}, ${layout.curtains.left.scaleY})`
            : 'translate(0, 0) scale(1, 1)';

        const rightTransform = visualZoomOn
            ? `translate(${layout.curtains.right.translateX}, 0%) scale(${layout.curtains.right.scaleX}, ${layout.curtains.right.scaleY})`
            : 'translate(0, 0) scale(1, 1)';

        api.setCurtain('left', {
            sideOffset: leftSideOffset,
            top: layout.curtains.left.top,
            width: layout.curtains.left.width,
            height: layout.curtains.left.height,
            transform: leftTransform,
        });

        api.setCurtain('right', {
            sideOffset: rightSideOffset,
            top: layout.curtains.right.top,
            width: layout.curtains.right.width,
            height: layout.curtains.right.height,
            transform: rightTransform,
        });

        // --- Frame (final) ---
        api.setFrame({
            width: '100%',
            height: 'auto',
            transform: sharedZoom, // 'scale(…)' already computed above
        });

        // Optional: one-line debug snapshot
        api.debugDump?.('Stage final');

    }, [layout, visualZoomOn, sharedZoom]);


    const rootStyle = useMemo<CSSProperties>(
        () => ({
            position: 'absolute',
            inset: 0,
            zIndex,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingTop: layout.stage.padTop,
            paddingBottom: layout.stage.padBottom,
            backgroundColor: 'transparent',
            overflow: 'hidden',
            cursor: 'default',
        }),
        [zIndex, layout.stage.padTop, layout.stage.padBottom]
    );

    // WIDTH-DRIVEN container with fixed aspect ratio
    const innerStyle = useMemo<CSSProperties>(
        () => ({
            position: 'relative',
            width: layout.stage.innerWidth,
            aspectRatio: ASPECT_RATIO,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 0,
            height: 'auto',
        }),
        [layout.stage.innerWidth]
    );

    const handleEmblem = useCallback(() => {
        if (onEmblemClick) onEmblemClick();
        else window.location.href = '/';
    }, [onEmblemClick]);

    const handleEmblemKey: React.KeyboardEventHandler<HTMLImageElement> = useCallback(
        (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleEmblem();
            }
        },
        [handleEmblem]
    );

    return (
        <div style={rootStyle}>
            {/* EMBLEM (kept for now) */}
            <img
                src={hover ? ASSETS.emblemHighlighted : ASSETS.emblem}
                alt="Stage Emblem"
                role="button"
                tabIndex={0}
                onKeyDown={handleEmblemKey}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={handleEmblem}
                style={{
                    position: 'absolute',
                    top: layout.emblem.top,
                    left: '50%',
                    width: layout.emblem.width,
                    transform: 'translateX(-58%)',
                    transformOrigin: 'center top',
                    zIndex: 410,
                    opacity: closeup ? 0 : 1,
                    pointerEvents: closeup ? 'none' : 'auto',
                    cursor: closeup ? 'default' : 'pointer',
                    transition: 'opacity 240ms ease',
                }}
            />

            <div style={innerStyle}>
                {/* Left Curtain */}
                <img
                    src={ASSETS.curtainLeft}
                    alt="Curtain Left"
                    role={phase === 'unzoomed' || phase === 'zoomed' ? 'button' : undefined}
                    tabIndex={phase === 'unzoomed' || phase === 'zoomed' ? 0 : -1}
                    onClick={handleCurtainActivate}
                    onKeyDown={handleCurtainKey}
                    style={{
                        position: 'absolute',
                        left: !visualZoomOn
                            ? layout.curtains.left.sideOffsetDefault
                            : layout.curtains.left.sideOffsetZoomed,
                        top: layout.curtains.left.top,
                        width: layout.curtains.left.width,
                        height: layout.curtains.left.height,
                        objectFit: 'cover',
                        zIndex: 250,
                        cursor: phase === 'zooming' ? 'default' : 'pointer',
                        pointerEvents: phase === 'zooming' ? 'none' : 'auto',
                        transform: visualZoomOn
                            ? `translate(${layout.curtains.left.translateX}, 0%) scale(${layout.curtains.left.scaleX}, ${layout.curtains.left.scaleY})`
                            : 'translate(0, 0) scale(1, 1)',
                        transition: 'transform 1.5s ease-in-out',
                        transformOrigin: 'right center',
                    }}
                />

                {/* Frame */}
                <img
                    src={ASSETS.frame}
                    alt="Stage Frame"
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        zIndex: 200,
                        pointerEvents: 'none',
                        transform: sharedZoom,
                        opacity: closeup ? 0 : 1,
                        transition: 'transform 1.5s ease-in-out, opacity 500ms ease-in-out',
                        transformOrigin: 'center center',
                    }}
                />

                {/* Right Curtain */}
                <img
                    src={ASSETS.curtainRight}
                    alt="Curtain Right"
                    role={phase === 'unzoomed' || phase === 'zoomed' ? 'button' : undefined}
                    tabIndex={phase === 'unzoomed' || phase === 'zoomed' ? 0 : -1}
                    onClick={handleCurtainActivate}
                    onKeyDown={handleCurtainKey}
                    style={{
                        position: 'absolute',
                        right: !visualZoomOn
                            ? layout.curtains.right.sideOffsetDefault
                            : layout.curtains.right.sideOffsetZoomed,
                        top: layout.curtains.right.top,
                        width: layout.curtains.right.width,
                        height: layout.curtains.right.height,
                        objectFit: 'cover',
                        zIndex: 250,
                        cursor: phase === 'zooming' ? 'default' : 'pointer',
                        pointerEvents: phase === 'zooming' ? 'none' : 'auto',
                        transform: visualZoomOn
                            ? `translate(${layout.curtains.right.translateX}, 0%) scale(${layout.curtains.right.scaleX}, ${layout.curtains.right.scaleY})`
                            : 'translate(0, 0) scale(1, 1)',
                        transition: 'transform 1.5s ease-in-out',
                        transformOrigin: 'left center',
                    }}
                />
            </div>
        </div>
    );
}

export default memo(Stage);
