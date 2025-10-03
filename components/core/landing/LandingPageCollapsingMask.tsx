'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import { useLogoAnchorStore } from '@/states/core/useLogoAnchorStore';

type Inset = { top?: number; right?: number; bottom?: number; left?: number };
type Offset = { x?: number; y?: number };

type Props = {
  /** Logo image path (public/) */
  logoSrc?: string;
  /** Fixed position fallback (used until anchor is valid) */
  logoTop?: string | number;   // e.g. '6rem'
  logoLeft?: string | number;  // e.g. '8rem'
  /** Dark overlay fill used by the mask */
  overlayColor?: string;       // e.g. '#201e1f'
  /** Extra distance outside the spotlight before showing the logo */
  revealMarginPx?: number;     // e.g. 150

  /** Enable following the navbar anchor from Zustand */
  followNavbar?: boolean;
  /** If 'match', size to the (inset) anchor rect; if number, force square size (px) */
  followSize?: number | 'match';
  /** Trim the followed rect to match visible area inside the wrapper */
  anchorInsetPx?: Inset;
  /** Final nudge after insetting */
  offsetPx?: Offset;
  /** Scale factors when matching size (>1 grows, <1 shrinks) */
  scaleX?: number;
  scaleY?: number;
};

/** ---- Debug toggles (module-scoped; only this file) ---- */
const DEBUG_FORCE_VISIBLE = false;           // <- flip to false when done
const LOGO_Z = 2147483647;
const OVERLAY_Z = 2147483000;

export default function LandingPageCollapsingMask({
  logoSrc = '/assets/core/navbar/logo_growing.svg',
  logoTop = '6rem',
  logoLeft = '8rem',
  overlayColor = '#201e1f',
  revealMarginPx = 150,

  followNavbar = true,
  followSize = 'match',
  anchorInsetPx,
  offsetPx,
  scaleX = 1.05,
  scaleY = 1.15,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const overlayRectRef = useRef<SVGRectElement | null>(null);
  const trackerRef = useRef<SVGCircleElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [mounted, setMounted] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);

  // Zustand anchor
  const anchor = useLogoAnchorStore((s) => s.anchor);
  const isFiniteNum = (v: unknown) => Number.isFinite(v as number);

  // Mount flag
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Build global mask svg+defs+overlay once (full-page)
  useEffect(() => {
    if (!mounted) return;

    // Create the SVG overlay
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.setAttribute('id', 'global-mask-svg');
    Object.assign(svgEl.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: String(OVERLAY_Z),
    });
    document.body.appendChild(svgEl);
    svgRef.current = svgEl;

    const svg = d3.select(svgEl);

    // defs + mask
    const defs = svg.append('defs');
    const mask = defs.append('mask').attr('id', 'shrink-mask');

    mask
      .append('rect')
      .attr('width', window.innerWidth)
      .attr('height', window.innerHeight)
      .attr('fill', 'white');

    const tracker = mask
      .append('circle')
      .attr('id', 'spotlight-tracker')
      .attr('cx', window.innerWidth / 2)
      .attr('cy', window.innerHeight / 2)
      .attr('r', Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2)) // start huge
      .attr('fill', 'black');

    trackerRef.current = tracker.node() as SVGCircleElement;

    const rect = svg
      .append('rect')
      .attr('id', 'global-mask-svg-overlay')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', window.innerWidth)
      .attr('height', window.innerHeight)
      .attr('fill', overlayColor)
      .attr('mask', 'url(#shrink-mask)')
      .style('pointer-events', 'none');

    overlayRectRef.current = rect.node() as SVGRectElement;

    const onResize = () => {
      if (!svgRef.current) return;
      d3.select(overlayRectRef.current)
        .attr('width', window.innerWidth)
        .attr('height', window.innerHeight);
      const t = d3.select(trackerRef.current);
      const diag = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
      t.attr('r', Math.max(Number(t.attr('r')) || 0, diag));
    };

    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      svg.selectAll('*').remove();
      svgRef.current?.parentNode?.removeChild(svgRef.current);
      svgRef.current = null;
      overlayRectRef.current = null;
      trackerRef.current = null;
    };
  }, [mounted, overlayColor]);

  // RAF loop — single-threshold logic; skip entirely if debugging forced-on
  useEffect(() => {
    if (!mounted || DEBUG_FORCE_VISIBLE) return;

    const loop = () => {
      let tracker = trackerRef.current;

      // Re-resolve by ID if our node was replaced
      if (!tracker || !(tracker as any).isConnected) {
        tracker = document.getElementById('spotlight-tracker') as SVGCircleElement | null;
        trackerRef.current = tracker;
      }

      const logoEl = logoRef.current;
      if (!tracker || !logoEl) {
        // Match the working behavior: hide if spotlight/element isn't available
        setLogoVisible(false);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const r  = parseFloat(tracker.getAttribute('r')  || '0');
      const cx = parseFloat(tracker.getAttribute('cx') || '0');
      const cy = parseFloat(tracker.getAttribute('cy') || '0');

      const box = logoEl.getBoundingClientRect();
      const lx = box.left + box.width / 2;
      const ly = box.top + box.height / 2;

      const dist = Math.hypot(cx - lx, cy - ly);

      // Single threshold: visible only when **outside** the spotlight
      setLogoVisible(dist > (r + (revealMarginPx ?? 150)));

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [mounted, revealMarginPx]);

  // Force-on when debugging
  useEffect(() => {
    if (!mounted) return;
    if (DEBUG_FORCE_VISIBLE) {
      setLogoVisible(true);
      return () => {};
    }
  }, [mounted]);

  if (!mounted) return null;

  // ----- Follow-from-Zustand with safe fallback (no NaNs) -----
  const inset = {
    top: anchorInsetPx?.top ?? 2,
    right: anchorInsetPx?.right ?? 0,
    bottom: anchorInsetPx?.bottom ?? 2,
    left: anchorInsetPx?.left ?? 6,
  };
  const offset = {
    x: offsetPx?.x ?? 0,
    y: offsetPx?.y ?? -2,
  };
  const snap = (v: number) => {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(v * dpr) / dpr;
  };
  const safe = (n: number) => (Number.isFinite(n) ? n : 0);

  const canFollow =
    followNavbar &&
    anchor &&
    isFiniteNum(anchor.left) &&
    isFiniteNum(anchor.top) &&
    isFiniteNum(anchor.width) &&
    isFiniteNum(anchor.height) &&
    (anchor.width as number) > 0 &&
    (anchor.height as number) > 0;

  let topCss: string, leftCss: string, widthCss: string, heightCss: string;

  if (canFollow) {
    const a = anchor as { left: number; top: number; width: number; height: number };
    const baseW = Math.max(0, safe(a.width)  - safe(inset.left) - safe(inset.right));
    const baseH = Math.max(0, safe(a.height) - safe(inset.top)  - safe(inset.bottom));

    const sx = Number.isFinite(scaleX) ? scaleX : 1;
    const sy = Number.isFinite(scaleY) ? scaleY : 1;

    const scaledW = Math.max(1, baseW * sx);
    const scaledH = Math.max(1, baseH * sy);

    const leftPx = snap(safe(a.left) + safe(inset.left) + safe(offset.x) - (scaledW - baseW) / 2);
    const topPx  = snap(safe(a.top)  + safe(inset.top)  + safe(offset.y) - (scaledH - baseH) / 2);

    leftCss   = `${leftPx}px`;
    topCss    = `${topPx}px`;
    widthCss  = followSize === 'match' ? `${snap(scaledW)}px` : `${Number(followSize) || 150}px`;
    heightCss = followSize === 'match' ? `${snap(scaledH)}px` : `${Number(followSize) || 150}px`;
  } else {
    leftCss   = typeof logoLeft === 'number' ? `${logoLeft}px` : logoLeft;
    topCss    = typeof logoTop  === 'number' ? `${logoTop}px`  : logoTop;
    widthCss  = '150px';
    heightCss = '150px';
  }

  // Portal the logo wrapper (force top-most z-index)
  return createPortal(
    <div
      ref={logoRef}
      style={{
        position: 'fixed',
        top: topCss,
        left: leftCss,
        zIndex: LOGO_Z,      // guaranteed above the SVG overlay
        pointerEvents: 'none',
        opacity: logoVisible ? 1 : 0,
        transition: 'opacity 60ms linear',
        width: widthCss,
        height: heightCss,
        // Optional debug outline so you see it even if the image 404s:
        outline: DEBUG_FORCE_VISIBLE ? '2px dashed #9cf' : 'none',
        outlineOffset: '2px',
        background: DEBUG_FORCE_VISIBLE ? 'rgba(80,120,200,0.08)' : 'transparent',
      }}
      aria-hidden={!logoVisible}
    >
      <img
        src={logoSrc}
        alt=""
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none' }}
      />
    </div>,
    document.body
  );
}
