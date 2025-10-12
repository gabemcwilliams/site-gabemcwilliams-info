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

type RingSpec = {
    z: number;
    opacity: number;
    heightVh: number;
    bottomVh: number;
    filter?: string;
    width?: number | string;
};

type FlameSpec = {
    heightVh: number;
    bottomVh: number;
    opacity: number;
    altChance: number;
    minSwapMs: number;
    maxSwapMs: number;
};

export interface CampfireProps {
    ring?: Partial<RingSpec>;
    visible?: boolean;
    zIndex?: number;
    publishToStore?: boolean;
}

const RING_SRC = '/assets/showcase/premiere/stage_setting/campfire/campfire_ring.svg';

// ---------- size & timing caps you can tweak in one place ----------
const RING_CAP = {
    WIDTH_VW: {MIN: 9, MAX: 20},        // ring width in vw
    BOTTOM_VH: {MIN: 14, MAX: 30},      // ring bottom offset in vh
    HEIGHT_VH: {MIN: 8, MAX: 16},       // ring height fallback in vh (used pre-measure)
} as const;

const FLAME_CAP = {
    HEIGHT_VH: {MIN: 4, MAX: 20},     // absolute flame height in vh
    BOTTOM_VH: {MIN: 15, MAX: 25},       // absolute flame bottom in vh
    OPACITY: {MIN: 0.2, MAX: .5},
    SWAP_MS: {MIN: 500, MAX: 1200},     // animation timing caps
} as const;

const CORE_FLAMES = [
    '/assets/showcase/premiere/stage_setting/campfire/flame_1.svg',
    '/assets/showcase/premiere/stage_setting/campfire/flame_2.svg',
    '/assets/showcase/premiere/stage_setting/campfire/flame_3.svg',
    '/assets/showcase/premiere/stage_setting/campfire/flame_4.svg',
] as const;

const ALT_FLAMES = [
    '/assets/showcase/premiere/stage_setting/campfire/flame_alt_1.svg',
    '/assets/showcase/premiere/stage_setting/campfire/flame_alt_2.svg',
] as const;

/* ========= continuous sizing (no breakpoints) ========= */

function clamp(n: number, a: number, b: number) {
    return Math.min(b, Math.max(a, n));
}

const clampRange = (n: number, range: { MIN: number; MAX: number }) =>
    clamp(n, range.MIN, range.MAX);


function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
}

// scales from 10vw → 14vw, bottom from 26vh → 18vh (then hard-capped)
function computeRing(vw: number): RingSpec {
    const t = clamp((vw - 1024) / (1920 - 1024), 0, 1);

    const widthVWRaw = lerp(10, 14, t);
    const bottomVHRaw = lerp(26, 18, t);

    const widthVW = clampRange(widthVWRaw, RING_CAP.WIDTH_VW);
    const bottomVH = clampRange(bottomVHRaw, RING_CAP.BOTTOM_VH);
    const heightVH = clampRange(12, RING_CAP.HEIGHT_VH); // fallback height cap

    return {
        z: 100,
        opacity: 1,
        heightVh: heightVH,
        bottomVh: Math.round(bottomVH),
        width: `${widthVW}vw`,
    };
}

function Campfire(
    {
        visible = true,
        ring: ringOverride,
        zIndex,
        publishToStore = true,
    }: CampfireProps) {
    if (!visible) return null;

    // Viewport width from store (no window listeners here)
    const vw = useResizeStore((s) => s.width ?? 1280);

    // Ring spec with optional overrides
    const ring: RingSpec = useMemo(() => {
        const base = computeRing(vw);
        return {
            ...base,
            ...ringOverride,
            heightVh: ringOverride?.heightVh ?? base.heightVh,
            bottomVh: ringOverride?.bottomVh ?? base.bottomVh,
            opacity: ringOverride?.opacity ?? base.opacity,
            z: ringOverride?.z ?? base.z,
            filter: ringOverride?.filter ?? base.filter,
            width: ringOverride?.width ?? base.width,
        };
    }, [vw, ringOverride]);

    // Preload sprites
    useEffect(() => {
        [RING_SRC, ...CORE_FLAMES, ...ALT_FLAMES].forEach((src) => {
            const i = new Image();
            i.src = src;
        });
    }, []);

    // Motion preference
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

    // Measure ring (vh) – re-measure on vw changes and when the node resizes
    const ringImgRef = useRef<HTMLImageElement | null>(null);
    const [ringVh, setRingVh] = useState<number | null>(null);

    const measureRing = () => {
        const el = ringImgRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = (rect.height / window.innerHeight) * 100;
        setRingVh(vh);
    };

    useEffect(() => {
        requestAnimationFrame(measureRing);
    }, [vw, ring.width, ring.heightVh, ring.bottomVh]);

    useEffect(() => {
        const el = ringImgRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => measureRing());
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Flames from measured ring (fallback to ring.heightVh)
    const flame: FlameSpec = useMemo(() => {
        const Rraw = ringVh ?? ring.heightVh;
        const R = clampRange(Rraw, RING_CAP.HEIGHT_VH);

        const heightRaw = 4 * R;
        const bottomRaw = ring.bottomVh + 0.75 * R;

        const heightVh = clampRange(heightRaw, FLAME_CAP.HEIGHT_VH);
        const bottomVh = clampRange(bottomRaw, FLAME_CAP.BOTTOM_VH);
        const opacity = clampRange(0.65, FLAME_CAP.OPACITY);

        const minSwapMs = Math.max(700, FLAME_CAP.SWAP_MS.MIN);
        const maxSwapMs = Math.min(1900, FLAME_CAP.SWAP_MS.MAX);

        return {
            heightVh,
            bottomVh,
            opacity,
            altChance: 0.14,
            minSwapMs,
            maxSwapMs,
        };
    }, [ringVh, ring.bottomVh, ring.heightVh]);

    // Crossfade sprites
    const [frontIdx, setFrontIdx] = useState(0);
    const [imgs, setImgs] = useState<[string, string]>([CORE_FLAMES[0], CORE_FLAMES[0]]);
    const frontIdxRef = useRef(frontIdx);
    useEffect(() => {
        frontIdxRef.current = frontIdx;
    }, [frontIdx]);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout> | undefined;

        const pickNext = () => {
            const useAlt = Math.random() < flame.altChance;
            const pool = useAlt ? ALT_FLAMES : CORE_FLAMES;
            return pool[Math.floor(Math.random() * pool.length)];
        };

        const loop = () => {
            if (prefersReduced.current) {
                timer = setTimeout(loop, 2000);
                return;
            }
            const back = 1 - frontIdxRef.current;
            const nextSrc = pickNext();

            setImgs((prev) => {
                const out = [...prev] as [string, string];
                out[back] = nextSrc;
                return out;
            });

            requestAnimationFrame(() => setFrontIdx(back));

            const delay = flame.minSwapMs + Math.random() * Math.max(0, flame.maxSwapMs - flame.minSwapMs);
            timer = setTimeout(loop, delay);
        };

        timer = setTimeout(loop, 700);
        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [flame.minSwapMs, flame.maxSwapMs, flame.altChance]);

    // Styles
    const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

    const ringStyle: CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: `${ring.bottomVh}vh`,
        width: ring.width ?? 'auto',
        height: ring.width ? 'auto' : `${ring.heightVh}vh`,
        display: 'block',
        objectFit: 'contain',
        pointerEvents: 'none',
        opacity: ring.opacity,
        filter: ring.filter,
        zIndex: (ring.z ?? 100) + 1,
        transition: `opacity 320ms ${EASE}`,
    };

    const flameBase: CSSProperties = {
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: `${flame.bottomVh}vh`,
        height: `${flame.heightVh}vh`,
        width: 'auto',
        display: 'block',
        objectFit: 'contain',
        pointerEvents: 'none',
        opacity: flame.opacity,
        filter: ring.filter,
        transition: `opacity 520ms ${EASE}, transform 520ms ${EASE}`,
        willChange: 'opacity, transform',
        zIndex: ring.z ?? 100,
    };

    // Publish POI (front flame)
    const flameARef = useRef<HTMLImageElement | null>(null);
    const flameBRef = useRef<HTMLImageElement | null>(null);

    const measureFlame = () => {
        if (!publishToStore) return;
        const idx = frontIdxRef.current;
        const flameEl = idx === 0 ? flameARef.current : flameBRef.current;
        if (!flameEl) return;
        const rect = flameEl.getBoundingClientRect();
        usePOIRevealStore.setState((s) => ({
            items: {
                ...s.items,
                fire: {
                    ...s.items.fire,
                    id: 'fire',
                    src: imgs[idx],
                    screenX: rect.left + rect.width / 2,
                    screenY: rect.top + rect.height / 2,
                    width: rect.width,
                    height: rect.height,
                    visible: s.items.fire?.visible ?? false,
                },
            },
        }));
    };

    const onImgLoad = () => {
        requestAnimationFrame(measureFlame);
    };

    useEffect(() => {
        requestAnimationFrame(measureFlame);
    }, [
        frontIdx,
        vw,                 // re-measure when viewport changes (store-driven)
        ring.bottomVh,
        ring.heightVh,
        ring.width,
        flame.bottomVh,
        flame.heightVh,
        publishToStore,
    ]);

    useEffect(() => {
        if (!publishToStore) return;
        const el = frontIdx === 0 ? flameARef.current : flameBRef.current;
        if (!el || typeof ResizeObserver === 'undefined') return;
        const ro = new ResizeObserver(() => measureFlame());
        ro.observe(el);
        return () => ro.disconnect();
    }, [frontIdx, publishToStore]);

    return (
        <div aria-hidden="true" style={{position: 'absolute', inset: 0, zIndex, pointerEvents: 'none'}}>
            {/* Flames (crossfade) */}
            <img
                ref={flameARef}
                src={imgs[0]}
                alt="Campfire flame A"
                style={{...flameBase, opacity: frontIdx === 0 ? flame.opacity : 0}}
                draggable={false}
                decoding="async"
                loading="eager"
                onLoad={onImgLoad}
            />
            <img
                ref={flameBRef}
                src={imgs[1]}
                alt="Campfire flame B"
                style={{...flameBase, opacity: frontIdx === 1 ? flame.opacity : 0}}
                draggable={false}
                decoding="async"
                loading="eager"
                onLoad={onImgLoad}
            />

            {/* Rock ring */}
            <img
                ref={ringImgRef}
                src={RING_SRC}
                alt="Campfire rock ring"
                style={ringStyle}
                draggable={false}
                decoding="async"
                loading="eager"
                onLoad={() => {
                    requestAnimationFrame(measureRing);
                    onImgLoad();
                }}
            />
        </div>
    );
}

export default memo(Campfire);
