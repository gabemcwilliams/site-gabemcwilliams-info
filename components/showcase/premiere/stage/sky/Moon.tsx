// components/showcase/premiere/Moon.tsx
'use client';

import {useEffect, useState, useId, useRef} from 'react';
import {usePOIRevealStore} from "@/states/showcase/premiere/usePOIRevealStore";

const MOON_BASE = '/assets/showcase/premiere/stage_setting/moons/moon_base.svg';
const MOON_BLOOD = '/assets/showcase/premiere/stage_setting/moons/moon_blood.svg';
const MOON_YELLOW = '/assets/showcase/premiere/stage_setting/moons/moon_yellow.svg';
const MOON_BRIGHT = '/assets/showcase/premiere/stage_setting/moons/moon_bright.svg';

type Range = { min: number; max: number };
type Side = 'left' | 'right' | 'random';

const YELLOW_THRESHOLD_VH = 15;

export interface MoonProps {
    size?: string;
    verticalRangeVh?: Range;
    leftRangeVw?: Range;
    rightRangeVw?: Range;
    side?: Side;
    zIndex?: number;
    alpha?: number;
    waxing?: boolean;
    phase?: number;
}

function rand(min: number, max: number) {
    return Math.random() * (max - min) + min;
}

function pickMoonImage(yVH: number) {
    const roll = Math.random();
    if (yVH >= YELLOW_THRESHOLD_VH) {
        if (roll < 0.2) return MOON_BLOOD;
        if (roll < 0.8) return MOON_YELLOW;
        return Math.random() < 0.5 ? MOON_BASE : MOON_BRIGHT;
    }
    return Math.random() < 0.5 ? MOON_BASE : MOON_BRIGHT;
}

type MaskVars = { angleDeg: number; featherPx: number; jitterPx: number; scale: number };
type Placement = { yVH: number; top: string; leftVW?: string; rightVW?: string };


export default function Moon(
    {
        size = '7vh',
        verticalRangeVh = {min: 1, max: 17},
        leftRangeVw = {min: 5, max: 10},
        rightRangeVw = {min: 5, max: 10},
        side = 'random',
        zIndex = 2,
        alpha = 1,
        waxing = true,
    }: MoonProps) {


    // Hand-tune for final alignment
    const MANUAL_NUDGE_PX = {x: 0, y: 0};  // tweak live: up is negative
    const MANUAL_HOLE_SCALE = 1;           // 1.0 = no change

    // ---------- IDs ----------
    const blurId = useId();
    const haloId = useId();
    const maskId = useId();
    const maskIdGlow = useId();

    // ---------- Refs (INSIDE component, singletons) ----------
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);
    const moonImgRef = useRef<SVGImageElement | null>(null);
    const measureDiscRef = useRef<SVGCircleElement | null>(null);


    // ---------- Phase / mask vars ----------
    const [phaseState, setPhase] = useState<number>(0.75);
    useEffect(() => setPhase(Math.random()), []);

    const [maskVars, setMaskVars] = useState<MaskVars>({
        angleDeg: 0, featherPx: 1.5, jitterPx: 0, scale: 1,
    });
    useEffect(() => {
        setMaskVars({
            angleDeg: Math.random() * 20 - 10,
            featherPx: 0.8 + Math.random() * 1.6,
            jitterPx: Math.random() * 6 - 3,
            scale: 0.98 + Math.random() * 0.04,
        });
    }, []);

    // Placement (percent based)
    const [placement, setPlacement] = useState<Placement>({
        yVH: verticalRangeVh.min,
        top: `${verticalRangeVh.min}vh`,
        leftVW: `${leftRangeVw.min}vw`,
        rightVW: undefined,
    });

    useEffect(() => {
        const yVH = rand(verticalRangeVh.min, verticalRangeVh.max);
        const chosen = side === 'random' ? (Math.random() < 0.5 ? 'left' : 'right') : side;
        if (chosen === 'left') {
            setPlacement({yVH, top: `${yVH}vh`, leftVW: `${rand(leftRangeVw.min, leftRangeVw.max)}vw`});
        } else {
            setPlacement({yVH, top: `${yVH}vh`, rightVW: `${rand(rightRangeVw.min, rightRangeVw.max)}vw`});
        }

    }, []);

    const [src, setSrc] = useState<string>(MOON_BASE);
    useEffect(() => setSrc(pickMoonImage(placement.yVH)), [placement.yVH]);

    // ---------- Phase math ----------
    const p = Math.max(0, Math.min(1, phaseState));
    const r = 50;
    const baseOffset = (1 - 2 * p) * r;
    const offset = (waxing ? 1 : -1) * baseOffset;

    // ---------- Visual params ----------
    const litR = 50 * maskVars.scale;
    const glowR = litR * 1.06;
    const glowStroke = 3;
    const glowBlur = 6;
    const glowOpacity = 0.8;

    const IMAGE_MASK_PAD = 3.5;
    const imageMaskR = litR + IMAGE_MASK_PAD;

    const haloPad = Math.ceil(3 * glowBlur + glowStroke / 2 + 2);
    const SHADOW_PAD = Math.max(3, Math.ceil(3 * maskVars.featherPx + 1));

    // ---------- Publish coarse placement (vw/vh + src) ----------
    const setItem = usePOIRevealStore(s => s.setItem);
    useEffect(() => {
        const xVW = placement.leftVW
            ? parseFloat(placement.leftVW)
            : 100 - parseFloat(placement.rightVW ?? '0');

        setItem('moon', {src, xVW, yVH: placement.yVH, scale: maskVars.scale});
    }, [placement.leftVW, placement.rightVW, placement.yVH, maskVars.scale, src, setItem]);

// --- Precise screen-space measurement (tight painted disc) ---
    useEffect(function measureMoonTightDisc() {
        const svgEl = svgRef.current;
        const discEl = measureDiscRef.current;
        if (!svgEl || !discEl) return;

        const measure = () => {
            // getBBox is in SVG units; getScreenCTM converts to CSS px
            const bb = discEl.getBBox();            // (x,y,w,h) in viewBox coords
            const ctm = discEl.getScreenCTM();
            if (!ctm) return;

            // Helper to transform a point by the element’s screen CTM
            const toScreen = (x: number, y: number) => {
                const pt = svgEl.createSVGPoint();
                pt.x = x;
                pt.y = y;
                return pt.matrixTransform(ctm);
            };

            const p1 = toScreen(bb.x, bb.y);
            const p2 = toScreen(bb.x + bb.width, bb.y + bb.height);

            const left = Math.min(p1.x, p2.x);
            const top = Math.min(p1.y, p2.y);
            const w = Math.abs(p2.x - p1.x);
            const h = Math.abs(p2.y - p1.y);
            const d = Math.min(w, h) * MANUAL_HOLE_SCALE;

            setItem('moon', {
                src,
                screenX: left + w / 2 + MANUAL_NUDGE_PX.x,
                screenY: top + h / 2 + MANUAL_NUDGE_PX.y,
                width: d,          // diameter for the overlay hole
                height: d,
            });
        };

        measure();

        // Observe size changes of the SVG; also react to window resizes/zoom
        const ro = new ResizeObserver(measure);
        ro.observe(svgEl);
        window.addEventListener('resize', measure);

        // Some browsers expose DPR change via media queries
        const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
        mq.addEventListener?.('change', measure);

        return () => {
            ro.disconnect();
            window.removeEventListener('resize', measure);
            mq.removeEventListener?.('change', measure);
        };
    }, [
        src,
        size,
        placement.top,
        placement.leftVW,
        placement.rightVW,
        maskVars.scale,
        setItem,
    ]);


    return (
        <div
            ref={wrapperRef}
            style={{
                position: 'absolute',
                top: placement.top,
                left: placement.leftVW,
                right: placement.rightVW,
                width: size,
                height: size,            // fixed footprint
                pointerEvents: 'none',
                opacity: alpha,
                zIndex,
            }}
            aria-hidden
            data-moon-phase={p.toFixed(3)}
        >
            <svg
                ref={svgRef}
                viewBox="0 0 120 120"
                width="100%"
                height="100%"
                style={{display: 'block', overflow: 'visible'}}
            >
                <defs>
                    {/* Mask feather blur region */}
                    <filter id={blurId} filterUnits="userSpaceOnUse" x={-200} y={-200} width={500} height={500}>
                        <feGaussianBlur stdDeviation={maskVars.featherPx}/>
                    </filter>

                    {/* Halo blur region */}
                    <filter id={haloId} filterUnits="userSpaceOnUse"
                            x={-haloPad} y={-haloPad} width={100 + 2 * haloPad} height={100 + 2 * haloPad}>
                        <feGaussianBlur stdDeviation={glowBlur}/>
                    </filter>

                    {/* Phase mask for the moon image */}
                    <mask id={maskId} maskUnits="userSpaceOnUse" x={-160} y={-160} width={420} height={420}>
                        <rect x={-160} y={-160} width={420} height={420} fill="black"/>
                        <g transform={`rotate(${maskVars.angleDeg} 50 50)`}>
                            <circle cx="50" cy="50" r={imageMaskR} fill="white"/>
                            <circle
                                cx={50 + offset + maskVars.jitterPx}
                                cy="50"
                                r={imageMaskR + SHADOW_PAD}
                                fill="black"
                                filter={`url(#${blurId})`}
                            />
                        </g>
                    </mask>

                    {/* Wider mask for the glow */}
                    <mask id={maskIdGlow} maskUnits="userSpaceOnUse" x={-200} y={-200} width={500} height={500}>
                        <rect x={-200} y={-200} width={500} height={500} fill="black"/>
                        <g transform={`rotate(${maskVars.angleDeg} 50 50)`}>
                            <circle cx="50" cy="50" r={litR * 2.2} fill="white"/>
                            <circle
                                cx={50 + offset + maskVars.jitterPx}
                                cy="50"
                                r={litR + SHADOW_PAD}
                                fill="black"
                                filter={`url(#${blurId})`}
                            />
                        </g>
                    </mask>
                </defs>

                {/* Moon art (single instance) */}
                <g mask={`url(#${maskId})`}>
                    <image
                        ref={moonImgRef}
                        href={src}
                        x="0" y="0" width="100" height="100"
                        preserveAspectRatio="xMidYMid meet"
                    />
                </g>

                {/* Rim glow */}
                <circle
                    cx="50" cy="50" r={glowR}
                    fill="none" stroke="#FFE9A8" strokeWidth={glowStroke} strokeOpacity={glowOpacity}
                    filter={`url(#${haloId})`}
                    mask={`url(#${maskIdGlow})`}
                    style={{mixBlendMode: 'screen'}}
                />

                {/* Invisible measuring disc (matches the art’s ideal disc) */}
                <circle
                    ref={measureDiscRef}
                    cx="50"
                    cy="50"
                    r="50"
                    fill="none"
                    stroke="none"
                    opacity="0"
                    pointerEvents="none"
                />
            </svg>
        </div>
    )
        ;
}
