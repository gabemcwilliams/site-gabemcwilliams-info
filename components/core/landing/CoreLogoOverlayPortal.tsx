'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as d3 from 'd3';
import { useLogoAnchorStore } from '@/states/core/useLogoAnchorStore';

type Inset = { top?: number; right?: number; bottom?: number; left?: number };
type Offset = { x?: number; y?: number };

type Props = {
  logoSrc?: string;
  logoTop?: string | number;
  logoLeft?: string | number;
  overlayColor?: string;
  revealMarginPx?: number;
  zIndex?: number;
  followNavbar?: boolean;
  followSize?: number | 'match';
  /** Trim the followed rect to match the visible row inside the wrapper */
  anchorInsetPx?: Inset;
  /** Final nudge after insetting */
  offsetPx?: Offset;
  /** DEBUG: force visible regardless of mask */
  alwaysShow?: boolean;
  /** Scale factors: >1 grows, <1 shrinks */
  scaleX?: number; // default 1.05
  scaleY?: number; // default 1.15 (taller icon)
};

export default function CoreLogoOverlayPortal({
  logoSrc = '/assets/logos/logo_img.svg',
  logoTop = '6rem',
  logoLeft = '8rem',
  overlayColor = '#201e1f',
  revealMarginPx = 150,
  zIndex = 9999,
  followNavbar = true,
  followSize = 'match',
  anchorInsetPx,
  offsetPx,
  alwaysShow = false,
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
  const lastFlipTsRef = useRef(0);

  const anchor = useLogoAnchorStore((s) => s.anchor);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Build mask once
  useEffect(() => {
    if (!mounted) return;

    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgEl.id = 'global-mask-svg';
    Object.assign(svgEl.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: String(zIndex),
    });
    document.body.appendChild(svgEl);
    svgRef.current = svgEl;

    const svg = d3.select(svgEl);
    const defs = svg.append('defs');
    const mask = defs.append('mask').attr('id', 'shrink-mask');

    mask.append('rect')
      .attr('width', window.innerWidth)
      .attr('height', window.innerHeight)
      .attr('fill', 'white');

    const tracker = mask.append('circle')
      .attr('id', 'spotlight-tracker')
      .attr('cx', window.innerWidth / 2)
      .attr('cy', window.innerHeight / 2)
      .attr('r', Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2))
      .attr('fill', 'black');

    trackerRef.current = tracker.node() as SVGCircleElement;

    const rect = svg.append('rect')
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
  }, [mounted, overlayColor, zIndex]);

  // Visibility loop with hysteresis
  useEffect(() => {
    if (!mounted) return;

    const SHOW_MARGIN = Math.max(0, revealMarginPx - 40);
    const HIDE_MARGIN = revealMarginPx + 40;
    const MIN_HOLD_MS = 220;

    const loop = () => {
      if (alwaysShow) {
        if (!logoVisible) {
          setLogoVisible(true);
          lastFlipTsRef.current = performance.now();
        }
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      let tracker = trackerRef.current;
      if (!tracker || !(tracker as any).isConnected) {
        tracker = document.getElementById('spotlight-tracker') as SVGCircleElement | null;
        trackerRef.current = tracker;
      }

      const logoEl = logoRef.current;
      if (!tracker || !logoEl) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const r = parseFloat(tracker.getAttribute('r') || '0');
      const cx = parseFloat(tracker.getAttribute('cx') || '0');
      const cy = parseFloat(tracker.getAttribute('cy') || '0');

      const box = logoEl.getBoundingClientRect();
      const lx = box.left + box.width / 2;
      const ly = box.top + box.height / 2;
      const dist = Math.hypot(cx - lx, cy - ly);

      const now = performance.now();
      const timeSinceFlip = now - lastFlipTsRef.current;

      if (!logoVisible) {
        if (dist > (r + SHOW_MARGIN) && timeSinceFlip >= MIN_HOLD_MS) {
          setLogoVisible(true);
          lastFlipTsRef.current = now;
        }
      } else {
        if (dist < (r + HIDE_MARGIN) && timeSinceFlip >= MIN_HOLD_MS) {
          setLogoVisible(false);
          lastFlipTsRef.current = now;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [mounted, revealMarginPx, alwaysShow, logoVisible]);

  if (!mounted) return null;

  // ----- Follow logic with inset + offset (+ scaling) ------------------------
  const useAnchor = followNavbar && !!anchor;

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

  // Utility: snap to device pixels to avoid sub-pixel fuzz
  const snap = (v: number) => {
    const dpr = window.devicePixelRatio || 1;
    return Math.round(v * dpr) / dpr;
  };

  let top: string, left: string, width: string, height: string;

  if (useAnchor) {
    const a = anchor!;
    const baseW = Math.max(0, a.width  - inset.left - inset.right);
    const baseH = Math.max(0, a.height - inset.top  - inset.bottom);

    const scaledW = baseW * scaleX;
    const scaledH = baseH * scaleY;

    const leftPx = snap(a.left + inset.left + offset.x - (scaledW - baseW) / 2);
    const topPx  = snap(a.top  + inset.top  + offset.y - (scaledH - baseH) / 2);

    left  = `${leftPx}px`;
    top   = `${topPx}px`;
    width = followSize === 'match' ? `${snap(scaledW)}px` : `${followSize}px`;
    height= followSize === 'match' ? `${snap(scaledH)}px` : `${followSize}px`;
  } else {
    left  = typeof logoLeft === 'number' ? `${logoLeft}px` : logoLeft;
    top   = typeof logoTop  === 'number' ? `${logoTop}px`  : logoTop;
    width = '150px';
    height= '150px';
  }

  return createPortal(
    <div
      ref={logoRef}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: zIndex + 1,
        pointerEvents: 'none',
        opacity: logoVisible ? 1 : 0,
        transition: 'opacity 80ms linear',
        width,
        height,
        // final tiny nudge (if needed)
        transform: 'translate(-3px, 2.3px)',
      }}
      aria-hidden={!logoVisible}
    >
      <img
        src={logoSrc}
        alt=""
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          userSelect: 'none',
        }}
      />
    </div>,
    document.body
  );
}
