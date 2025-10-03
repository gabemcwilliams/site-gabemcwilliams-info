// components/showcase/premiere/spotlight/overlay/PremiereSpotlightSearchMask.tsx
'use client';

import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
// import {usePathname} from 'next/navigation';


import Image from 'next/image';
import Link from 'next/link';
import {useLogoAnchorStore} from '@/states/core/useLogoAnchorStore';
import {useSpotlightMaskStore} from '@/states/showcase/premiere/useSpotlightMaskStore';

type Inset = { top?: number; right?: number; bottom?: number; left?: number };
type Offset = { x?: number; y?: number };

type Props = {
    logoSrc?: string;
    logoTop?: string | number;
    logoLeft?: string | number;
    followNavbar?: boolean;
    followSize?: number | 'match';
    anchorInsetPx?: Inset;
    offsetPx?: Offset;
    scaleX?: number;
    scaleY?: number;
    revealMarginPx?: number;
    spotlightId?: string; // id of <circle> that drives the spotlight
    debug?: boolean;
};

const LOGO_Z = 2147483647;

export default function PremiereSpotlightSearchMask(
    {
        logoSrc = '/assets/core/navbar/logo_growing.svg',
        logoTop = '6rem',
        logoLeft = '8rem',
        followNavbar = true,
        followSize = 'match',
        anchorInsetPx,
        offsetPx,
        scaleX = 1.05,
        scaleY = 1.05,
        revealMarginPx = 150,
        spotlightId = 'spotlight-tracker',
        debug = false,
    }: Props) {
    // --- state/refs


    const [hydrated, setHydrated] = useState(false);
    const [visible, setVisible] = useState(false);

    // const pathname = usePathname();
    // const graceFramesRef = useRef(0);
    //
    // useEffect(() => {
    //     setVisible(true);
    //     graceFramesRef.current = 2; // tune if needed
    // }, [pathname]);


    const containerRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);

    // follow the navbar anchor
    const anchor = useLogoAnchorStore((s) => s.anchor);
    const lastAnchor = useLogoAnchorStore((s) => s.lastAnchor);
    const effective = anchor ?? lastAnchor;

    // spotlight on/off – drives whether the icon should be active at all
    const spotlightOn = useSpotlightMaskStore((s) => s.enabled);

    useEffect(() => setHydrated(true), []);

    // Visibility loop driven by spotlight circle
    useEffect(() => {
        if (!hydrated) return;

        // If the spotlight is off, hide the icon and stop the loop
        if (!spotlightOn) {
            setVisible(false);
            if (rafRef.current != null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            return;
        }

        const loop = () => {
            // if (graceFramesRef.current > 0) {
            //     graceFramesRef.current -= 1;
            //     setVisible(true);
            //     rafRef.current = requestAnimationFrame(loop);
            //     return;
            // }

            const tracker = document.getElementById(spotlightId) as SVGCircleElement | null;
            const boxEl = containerRef.current;

            // If the spotlight node is gone (mask removed), hide the icon
            if (!tracker || !boxEl) {
                setVisible(false);
                rafRef.current = requestAnimationFrame(loop);
                return;
            }

            const r = parseFloat(tracker.getAttribute('r') || '0');
            const cx = parseFloat(tracker.getAttribute('cx') || '0');
            const cy = parseFloat(tracker.getAttribute('cy') || '0');

            const rect = boxEl.getBoundingClientRect();
            const lx = rect.left + rect.width / 2;
            const ly = rect.top + rect.height / 2;

            const dist = Math.hypot(cx - lx, cy - ly);

            // visible only when logo center is OUTSIDE the spotlight circle + margin
            setVisible(dist > r + (revealMarginPx ?? 150));

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [hydrated, spotlightOn, spotlightId, revealMarginPx]);

    // ----- positioning / sizing -----
    const inset = {
        top: anchorInsetPx?.top ?? 0,
        right: anchorInsetPx?.right ?? 0,
        bottom: anchorInsetPx?.bottom ?? 0,
        left: anchorInsetPx?.left ?? 0,
    };
    const offset = {x: offsetPx?.x ?? 0, y: offsetPx?.y ?? 0};

    const snap = (v: number) => {
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        return Math.round(v * dpr) / dpr;
    };
    const safe = (n: unknown) => (Number.isFinite(n as number) ? (n as number) : 0);

    const remToPx = (v: string) => {
        const m = v.match(/^([\d.]+)rem$/);
        if (!m) return NaN;
        const root =
            typeof window !== 'undefined'
                ? parseFloat(getComputedStyle(document.documentElement).fontSize || '16')
                : 16;
        return parseFloat(m[1]) * root;
    };
    const toPx = (v: string | number) =>
        typeof v === 'number'
            ? v
            : v.endsWith('px')
                ? parseFloat(v)
                : v.endsWith('rem')
                    ? remToPx(v)
                    : NaN;

    const e = effective as { left?: number; top?: number; width?: number; height?: number } | null;
    const hasLT = !!e && Number.isFinite(e.left) && Number.isFinite(e.top);
    const hasWH =
        !!e && Number.isFinite(e.width) && Number.isFinite(e.height) && e!.width! > 0 && e!.height! > 0;

    const canFollowPos = followNavbar && hasLT;
    const canMatchSize = hasWH && followSize === 'match';

    let leftPx: number, topPx: number, widthPx: number, heightPx: number;

    if (canFollowPos) {
        leftPx = snap(safe(e!.left) + safe(inset.left) + safe(offset.x));
        topPx = snap(safe(e!.top) + safe(inset.top) + safe(offset.y));

        if (canMatchSize) {
            const baseW = Math.max(0, safe(e!.width) - safe(inset.left) - safe(inset.right));
            const baseH = Math.max(0, safe(e!.height) - safe(inset.top) - safe(inset.bottom));
            widthPx = snap(Math.max(1, baseW));
            heightPx = snap(Math.max(1, baseH));
        } else {
            const forced = Number(followSize) || 150;
            widthPx = snap(forced);
            heightPx = snap(forced);
        }
    } else {
        const l0 = toPx(logoLeft);
        const t0 = toPx(logoTop);
        const leftBase = Number.isFinite(l0) ? (l0 as number) : 24;
        const topBase = Number.isFinite(t0) ? (t0 as number) : 24;

        leftPx = snap(leftBase + safe(offset.x));
        topPx = snap(topBase + safe(offset.y));

        const forced = Number(followSize) || 150;
        widthPx = snap(forced);
        heightPx = snap(forced);
    }

    if (debug && typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.debug('[SpotlightMask]', {
            anchor,
            lastAnchor,
            effective,
            box: {leftPx, topPx, widthPx, heightPx},
            visible,
            spotlightOn,
        });
    }

    if (!hydrated) return null;

    return createPortal(
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                top: `${topPx}px`,
                left: `${leftPx}px`,
                width: `${widthPx}px`,
                height: `${heightPx}px`,
                zIndex: LOGO_Z,
                pointerEvents: visible ? 'auto' : 'none',
                overflow: 'hidden',
                opacity: visible ? 1 : 0,
                transition: 'opacity 20ms linear',
                outline: debug ? '2px solid lime' : 'none',
                background: debug ? 'rgba(0,255,0,0.06)' : 'transparent',
            }}
            aria-hidden={!visible}
            aria-label="Floating navbar logo"
        >
            <Link href="/" aria-label="Go home" className="relative block w-full h-full">
                <Image
                    src={logoSrc}
                    alt=""
                    draggable={false}
                    fill
                    className="object-bottom"
                    style={{
                        transform: `scale(${Number.isFinite(scaleX) ? scaleX : 1}, ${
                            Number.isFinite(scaleY) ? scaleY : 1
                        })`,
                        transformOrigin: 'center bottom',
                        userSelect: 'none',
                    }}
                    priority
                    sizes="(max-width: 9999px) 100vw"
                />
            </Link>
        </div>,
        document.body
    );
}
