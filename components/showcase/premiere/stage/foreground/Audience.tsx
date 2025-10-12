'use client';

import React, {
    memo,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
} from 'react';
import {usePOIRevealStore} from '@/states/showcase/premiere/usePOIRevealStore';
import {useResizeStore} from '@/states/useResizeProvider';
import {useArtifactPlacementStore} from "@/states/showcase/premiere/stage_setting/useArtifactPlacementStore";
import {shallow} from 'zustand/shallow';

/* =========================
   Types
   ========================= */
export interface AudienceProps {
    visible?: boolean;   // can still be controlled by parent if you want
    zoom?: boolean;      // idem
    zIndex?: number;
    minSwapMs?: number;
    maxSwapMs?: number;
}

/* =========================
   Constants
   ========================= */
const VARIANTS: readonly string[] = [
    '/assets/showcase/premiere/stage_setting/children/children_sitting_1.svg',
    '/assets/showcase/premiere/stage_setting/children/children_sitting_2.svg',
    '/assets/showcase/premiere/stage_setting/children/children_sitting_3.svg',
    '/assets/showcase/premiere/stage_setting/children/children_sitting_4.svg',
    '/assets/showcase/premiere/stage_setting/children/children_sitting_5.svg',
] as const;


/* =========================
   Component
   ========================= */
function Audience(
    {
        visible = true,
        zoom = false,
        zIndex = 700,
        minSwapMs = 700,
        maxSwapMs = 1900,
    }: AudienceProps) {
    //  Read width from the minimal store; no local resize listeners
    const vw = useResizeStore(s => s.width ?? 1280);

// Compute using proportional or clamped math instead of discrete breakpoints
    const baseHeight = useMemo(() => {
        // scale roughly between 18vh and 35vh as screen grows
        const vh = Math.min(35, 18 + (vw / 1920) * 17);
        const vwClamp = Math.max(20, Math.min(32, 40 - (vw / 1920) * 8));
        return `min(${vh}vh, ${vwClamp}vw)`;
    }, [vw]);

    const bottomOffset = useMemo(() => {
        // move slightly upward on wide screens, downward on narrow ones
        const pct = Math.max(-2, 15 - (vw / 128)); // 15vh → -2vh across widths
        return `${pct}vh`;
    }, [vw]);


    //  Reduced motion
    const prefersReduced = useRef(false);
    useEffect(() => {
        const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
        prefersReduced.current = !!mq?.matches;
        const onChange = (e: MediaQueryListEvent) => {
            prefersReduced.current = e.matches;
        };
        mq?.addEventListener?.('change', onChange);
        return () => mq?.removeEventListener?.('change', onChange);
    }, []);

    //  Double-buffer crossfade
    const [frontIdx, setFrontIdx] = useState(0);
    const [imgs, setImgs] = useState<[string, string]>([VARIANTS[0], VARIANTS[0]]);
    const frontIdxRef = useRef(frontIdx);
    useEffect(() => {
        frontIdxRef.current = frontIdx;
    }, [frontIdx]);

    useEffect(() => {
        if (!visible || VARIANTS.length === 0) return;
        let timer: ReturnType<typeof setTimeout>;

        const loop = () => {
            if (prefersReduced.current) {
                timer = setTimeout(loop, 4000);
                return;
            }
            const next = Math.floor(Math.random() * VARIANTS.length);
            const back = 1 - frontIdxRef.current;

            setImgs((prev) => {
                const out = [...prev] as [string, string];
                out[back] = VARIANTS[next];
                return out;
            });

            requestAnimationFrame(() => setFrontIdx(back));

            const delay = minSwapMs + Math.random() * Math.max(0, maxSwapMs - minSwapMs);
            timer = setTimeout(loop, delay);
        };

        loop();
        return () => clearTimeout(timer);
    }, [visible, minSwapMs, maxSwapMs]);

    if (!visible) return null;

    // 🎛️ Styles
    const commonImgStyle: CSSProperties = useMemo(() => {
        const t = zoom ? 'translateY(3vh) scale(0.98)' : 'translateY(0) scale(1)';
        return {
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transformOrigin: 'bottom center',
            transform: `${t} translateZ(0)`,
            transition: 'transform 800ms ease',
            display: 'block',
            willChange: 'opacity, transform',
            pointerEvents: 'none',
            userSelect: 'none',
        } as const;
    }, [zoom]);

    // Publish POI to store
    const img0Ref = useRef<HTMLImageElement | null>(null);
    const img1Ref = useRef<HTMLImageElement | null>(null);

    function measure() {
        const el = frontIdx === 0 ? img0Ref.current : img1Ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();

        usePOIRevealStore.setState((s) => ({
            items: {
                ...s.items,
                audience: {
                    ...s.items.audience,
                    id: 'audience',
                    src: imgs[frontIdx],
                    screenX: rect.left + rect.width / 2,
                    screenY: rect.top + rect.height / 2,
                    width: rect.width,
                    height: rect.height,
                    visible: s.items.audience?.visible ?? false,
                },
            },
        }));
    }

    const onImgLoad = () => requestAnimationFrame(measure);

    // Re-measure when: swap frame, size inputs from store change, or zoom toggles
    useEffect(() => {
        requestAnimationFrame(measure);
    }, [frontIdx, baseHeight, bottomOffset, zoom]);

    // If the rendered image node itself resizes for any reason, re-measure
    useEffect(() => {
        const el = frontIdx === 0 ? img0Ref.current : img1Ref.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => measure());
        ro.observe(el);
        return () => ro.disconnect();
    }, [frontIdx]);

    /* =========================
       Render
       ========================= */
    return (
        <div
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                zIndex,
                pointerEvents: 'none',
                overflow: 'hidden',
                contain: 'layout paint',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    bottom: bottomOffset,              // ← store-driven responsive lift
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 'clamp(480px, 60vw, 1200px)',
                    height: baseHeight,
                    pointerEvents: 'none',
                }}
            >
                <img
                    ref={img0Ref}
                    src={imgs[0]}
                    alt="Audience pose 0"
                    loading="eager"
                    decoding="async"
                    fetchPriority="low"
                    draggable={false}
                    onLoad={onImgLoad}
                    style={{...commonImgStyle, opacity: frontIdx === 0 ? 1 : 0}}
                />
                <img
                    ref={img1Ref}
                    src={imgs[1]}
                    alt="Audience pose 1"
                    loading="eager"
                    decoding="async"
                    fetchPriority="low"
                    draggable={false}
                    onLoad={onImgLoad}
                    style={{...commonImgStyle, opacity: frontIdx === 1 ? 1 : 0}}
                />
            </div>
        </div>
    );
}

export default memo(Audience);
