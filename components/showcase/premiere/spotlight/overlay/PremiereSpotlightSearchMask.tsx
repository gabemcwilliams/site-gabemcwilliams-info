// components/showcase/premiere/spotlight/overlay/PremiereSpotlightSearchMask.tsx
'use client';

import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
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
  anchorInsetPx?: Inset;     // nudge IMAGE only
  offsetPx?: Offset;         // nudge IMAGE only
  scaleX?: number;
  scaleY?: number;
  revealMarginPx?: number;   // spotlight distance rule
  spotlightId?: string;
  /** NEW: auto-hide after this many ms (0 disables) */
  idleHideAfterMs?: number;
  /** NEW: show again when mouse is within this many px of icon center */
  proximityPx?: number;
  debug?: boolean;
};

const LOGO_Z = 2147483647;

export default function PremiereSpotlightSearchMask({
  logoSrc = '/assets/core/navbar/logo_growing.svg',
  logoTop = '6rem',
  logoLeft = '8rem',
  followNavbar = true,
  followSize = 'match',
  anchorInsetPx,
  offsetPx,
  scaleX = 1,
  scaleY = 1,
  revealMarginPx = 150,
  spotlightId = 'spotlight-tracker',
  idleHideAfterMs = 500,      // <— half-second auto-hide
  proximityPx = 120,          // <— come back when cursor is near
  debug = false,
}: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [visible, setVisible] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // UI refs (avoid re-subscribing the RAF on each state change)
  const idleHiddenRef = useRef(false);
  const nearMouseRef = useRef(false);
  const draggingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);

  // follow the navbar anchor
  const anchor = useLogoAnchorStore((s) => s.anchor);
  const lastAnchor = useLogoAnchorStore((s) => s.lastAnchor);
  const effective = anchor ?? lastAnchor;

  // spotlight on/off – drives whether the icon is active at all
  const spotlightOn = useSpotlightMaskStore((s) => s.enabled);

  useEffect(() => setHydrated(true), []);

  // ---- DRAG detection (don’t pop the icon while holding the circle) ----
  useEffect(() => {
    if (!hydrated) return;

    const onDown = (e: MouseEvent) => {
      const path = (e.composedPath?.() ?? []) as Element[];
      draggingRef.current = path.some((el) => (el as HTMLElement)?.id === 'drag-target');
    };
    const onUp = () => {
      draggingRef.current = false;
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('mouseup', onUp);
    };
  }, [hydrated]);

  // ---- PROXIMITY detection (show when cursor near the icon) ----
  useEffect(() => {
    if (!hydrated) return;

    const clearIdleTimer = () => {
      if (idleTimerRef.current != null) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };

    const armIdleTimer = () => {
      clearIdleTimer();
      if (idleHideAfterMs > 0) {
        idleTimerRef.current = window.setTimeout(() => {
          idleHiddenRef.current = true;
        }, idleHideAfterMs);
      }
    };

    // start hidden countdown once
    idleHiddenRef.current = false;
    armIdleTimer();

    const onMove = (e: MouseEvent) => {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return;

      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const d = Math.hypot(e.clientX - cx, e.clientY - cy);

      const near = d <= proximityPx;
      // if near (and not dragging), cancel idle hide; otherwise (re)arm it
      if (near) {
        idleHiddenRef.current = false;
        clearIdleTimer();
      } else {
        armIdleTimer();
      }
      nearMouseRef.current = near;
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      clearIdleTimer();
    };
  }, [hydrated, proximityPx, idleHideAfterMs]);

  // ---- spotlight-driven loop + final visibility decision ----
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
      const tracker = document.getElementById(spotlightId) as SVGCircleElement | null;
      const boxEl = containerRef.current;

      if (!tracker || !boxEl) {
        setVisible(false);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // spotlight geometry
      const r = parseFloat(tracker.getAttribute('r') || '0');
      const sx = parseFloat(tracker.getAttribute('cx') || '0');
      const sy = parseFloat(tracker.getAttribute('cy') || '0');

      // icon center
      const rect = boxEl.getBoundingClientRect();
      const lx = rect.left + rect.width / 2;
      const ly = rect.top + rect.height / 2;

      const dist = Math.hypot(sx - lx, sy - ly);
      const outsideSpotlight = dist > r + (revealMarginPx ?? 150);

      // final rule:
      // show if (near mouse and not dragging) OR (outside spotlight and not idle-hidden)
      const show =
        (!draggingRef.current && nearMouseRef.current) ||
        (outsideSpotlight && !idleHiddenRef.current);

      setVisible(show);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [hydrated, spotlightOn, spotlightId, revealMarginPx]);

  // ----- positioning / sizing (WRAPPER matches anchor; image is nudged) -----
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
  const hasWH = !!e && Number.isFinite(e.width) && Number.isFinite(e.height) && e!.width! > 0 && e!.height! > 0;

  const canFollowPos = followNavbar && hasLT;
  const canMatchSize = hasWH && followSize === 'match';

  let leftPx: number, topPx: number, widthPx: number, heightPx: number;

  if (canFollowPos) {
    // wrapper = exact anchor (no nudges here)
    leftPx = snap(safe(e!.left));
    topPx = snap(safe(e!.top));
    if (canMatchSize) {
      widthPx = snap(Math.max(1, safe(e!.width)));
      heightPx = snap(Math.max(1, safe(e!.height)));
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
    leftPx = snap(leftBase);
    topPx = snap(topBase);
    const forced = Number(followSize) || 150;
    widthPx = snap(forced);
    heightPx = snap(forced);
  }

  // image-only nudge (keeps spotlight geometry intact)
  const insetX = (anchorInsetPx?.left ?? 0) - (anchorInsetPx?.right ?? 0);
  const insetY = (anchorInsetPx?.top ?? 0) - (anchorInsetPx?.bottom ?? 0);
  const nudgeX = (offsetPx?.x ?? 0) + insetX;
  const nudgeY = (offsetPx?.y ?? 0) + insetY;

  const sx = Number.isFinite(scaleX) ? (scaleX as number) : 1;
  const sy = Number.isFinite(scaleY) ? (scaleY as number) : 1;

  if (debug && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.debug('[PremiereSpotlightSearchMask]', {
      anchor,
      lastAnchor,
      effective,
      wrapper: { leftPx, topPx, widthPx, heightPx },
      image: { nudgeX, nudgeY, scaleX: sx, scaleY: sy },
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
        opacity: visible ? .8 : 0,
        transition: 'opacity 200ms cubic', // a touch smoother for fade
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
            transform: `translate(${nudgeX}px, ${nudgeY}px) scale(${sx}, ${sy})`,
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
