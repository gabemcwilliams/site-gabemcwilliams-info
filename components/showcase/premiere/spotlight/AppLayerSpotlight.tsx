'use client';

import SpotlightHydrationMask from './overlay/SpotlightHydrationMask';
import { usePOIRevealStore } from '@/states/showcase/premiere/usePOIRevealStore';
import type { RevealId } from '@/states/showcase/premiere/usePOIRevealStore';
import { useSpotlightMaskStore } from '@/states/showcase/premiere/useSpotlightMaskStore';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// ---------- helpers for SSR-safe viewport ----------
const vw = () => (typeof window !== 'undefined' ? window.innerWidth : 1280);
const vh = () => (typeof window !== 'undefined' ? window.innerHeight : 720);

// =========================
// Constants
// =========================
const DEFAULT_HOLE_SIZE = 140; // fallback for POI hole W/H when layout not yet measured
const HOVER_THRESHOLD = 50;    // distance (px) to count cursor/spotlight as "near" a POI
const FINISH_DELAY_MS = 600;   // delay before auto-finishing once all POIs are revealed
const FINAL_FADE_MS = 1200;    // how long to fade out before kill
const DEBUG_MARKERS = false;   // toggles debug overlay showing POI targets

// Force the spotlight on-screen to debug rendering/stacking
const DEBUG_FORCE_ON = false; // set false to restore normal behavior

// =========================
/** Main export wrapper (Suspense) */
// =========================
type AppLayerSpotlightProps = {
  initialCx?: number;
  initialCy?: number;
  initialOverlayVisible: number;
  initialR?: number;
  initiallyEnabled?: boolean;
  onMaskReady?: () => void;
};

export default function AppLayerSpotlight({
  initialOverlayVisible,
  onMaskReady,
  initialCx,
  initialCy,
  initialR,
  initiallyEnabled,
}: AppLayerSpotlightProps) {
  return (
    <Suspense fallback={<SpotlightHydrationMask />}>
      <Spotlight
        initialOverlayVisible={initialOverlayVisible}
        onMaskReady={onMaskReady}
        initialCx={initialCx}
        initialCy={initialCy}
        initialR={initialR}
        initiallyEnabled={initiallyEnabled}
      />
    </Suspense>
  );
}

// =========================
/** Derived POI type + extractor */
// =========================
type ZPoint = {
  name: RevealId;
  x: number;
  y: number;
  src: string;
  w: number;
  h: number;
  visible: boolean;
};

// Read-only getter that bypasses React state to grab latest store values (used in effects)
function getZPoints(): ZPoint[] {
  const items = usePOIRevealStore.getState().items;
  return Object.values(items)
    .filter((i) => i.screenX != null && i.screenY != null)
    .map((i) => ({
      name: i.id,
      src: i.src,
      x: i.screenX as number,
      y: i.screenY as number,
      w: i.width ?? DEFAULT_HOLE_SIZE,
      h: i.height ?? DEFAULT_HOLE_SIZE,
      visible: !!i.visible,
    }));
}

// =========================
/** Spotlight Component */
// =========================
function Spotlight({
  initialOverlayVisible,
  onMaskReady,
  initialCx,
  initialCy,
  initialR,
  initiallyEnabled,
}: {
  initialOverlayVisible: number;
  onMaskReady?: () => void;
  initialCx?: number;
  initialCy?: number;
  initialR?: number;
  initiallyEnabled?: boolean;
}) {
  // Subscribe to Zustand for reactive rerenders
  const items = usePOIRevealStore((s) => s.items);

  // One-shot seed consumed from the spotlight store (Landing -> Premiere handoff)
  type Seed = { cx: number; cy: number; r: number };
  const seedRef = useRef<Seed | null>(null);
  if (seedRef.current === null) {
    const api = useSpotlightMaskStore.getState();
    const s = api.consumeSeed?.() ?? null; // one-shot
    if (s) {
      // Sync store so later readers see the same geometry
      api.setAll(s);
      api.setEnabled(true);
    }
    seedRef.current = s as Seed | null;
  }
  const seed = seedRef.current;

  // Optionally seed the visibility store once (only when explicitly provided)
  useEffect(() => {
    if (typeof initiallyEnabled === 'boolean') {
      useSpotlightMaskStore.getState().setEnabled(initiallyEnabled);
    }
  }, [initiallyEnabled]);

  // Build initial values (seed -> props -> defaults)
  const cx0: number = (seed?.cx ?? initialCx) ?? vw() / 2;
  const cy0: number = (seed?.cy ?? initialCy) ?? vh() / 2;
  const r0: number  = (seed?.r  ?? initialR)  ?? 150;

  // Global toggle to mount/dismount spotlight layer
  const enabled = DEBUG_FORCE_ON ? true : useSpotlightMaskStore((s) => s.enabled);

  // Overlay fade state (0..1)
  const [overlayVisible, setOverlayVisible] = useState(initialOverlayVisible);
  const fadingOutRef = useRef(false);
  const finishTimerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  // Core refs/state used by effect-driven D3 code
  const svgRef = useRef<SVGSVGElement | null>(null);
  const svgRefMarkers = useRef<SVGSVGElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const [maskReady, setMaskReady] = useState(false);
  const trackerNodeRef = useRef<SVGCircleElement | null>(null);

  const stopInteractivityRef = useRef<boolean>(false);
  const freezeUntilUpRef = useRef(false);
  const dragTargetNodeRef = useRef<SVGCircleElement | null>(null);

  // =========================
  // Mask Helpers
  // =========================
  function showPoiHole(p: { x: number; y: number; src: string; w?: number; h?: number }) {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const mask = svg.select('#spotlight-mask');

    const W = p.w ?? DEFAULT_HOLE_SIZE;
    const H = p.h ?? DEFAULT_HOLE_SIZE;

    mask.selectAll('.poi-hole').remove();
    mask
      .append('image')
      .attr('class', 'poi-hole')
      .attr('href', p.src)
      .attr('x', p.x - W / 2)
      .attr('y', p.y - H / 2)
      .attr('width', W)
      .attr('height', H)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('filter', 'url(#alphaToBlack)');
  }

  function clearPoiHole() {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.select('#spotlight-mask').selectAll('.poi-hole').remove();
  }

  // =========================
  // D3 Setup: Mask + Dragging (named effect)
  // =========================
  function maskSetupEffect() {
    if (!enabled) return;
    if (stopInteractivityRef.current) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = vw();
    const height = vh();

    const svg = d3
      .select(svgEl)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('position', 'fixed')
      .style('top', '0')
      .style('left', '0')
      .style('z-index', '0');

    const defs = svg.append('defs');

    const fBlack = defs.append('filter').attr('id', 'alphaToBlack').attr('color-interpolation-filters', 'sRGB');

    fBlack.append('feComponentTransfer').attr('in', 'SourceAlpha').append('feFuncA').attr('type', 'table').attr('tableValues', '0 1');

    fBlack
      .append('feColorMatrix')
      .attr('type', 'matrix')
      .attr(
        'values',
        `
        0 0 0 0 0
        0 0 0 0 0
        0 0 0 0 0
        0 0 0 1 0
      `
      );

    const mask = defs
      .append('mask')
      .attr('id', 'spotlight-mask')
      .attr('maskUnits', 'userSpaceOnUse')
      .attr('maskContentUnits', 'userSpaceOnUse');

    mask.append('rect').attr('width', width).attr('height', height).attr('fill', 'white');

    // Seed from one-shot values (no live subscription)
    const circle = mask
      .append('circle')
      .attr('id', 'spotlight-tracker')
      .attr('cx', cx0)
      .attr('cy', cy0)
      .attr('r', r0)
      .attr('fill', 'black');

    trackerNodeRef.current = circle.node() as SVGCircleElement | null;

    svg
      .append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#201e1f')
      .attr('fill-opacity', DEBUG_FORCE_ON ? 0.85 : overlayVisible) // ensure visible while debugging
      .attr('mask', 'url(#spotlight-mask)')
      .attr('pointer-events', 'none');

    const dragTarget = svg
      .append('circle')
      .attr('id', 'drag-target')
      .attr('cx', cx0)
      .attr('cy', cy0)
      .attr('r', r0)
      .attr('fill', 'transparent')
      .style('cursor', 'grab')
      .style('pointer-events', 'all');

    const dragTargetNode = dragTarget.node();
    dragTargetNodeRef.current = dragTargetNode as SVGCircleElement | null;

    const handleMouseDown = (e: MouseEvent) => {
      if (overlayVisible <= 0) return;
      if (freezeUntilUpRef.current) {
        e.preventDefault();
        return;
      }
      isDraggingRef.current = true;
      if (dragTargetNodeRef.current) dragTargetNodeRef.current.style.cursor = 'grabbing';
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      if (dragTargetNodeRef.current) dragTargetNodeRef.current.style.cursor = 'grab';
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (freezeUntilUpRef.current) {
        event.preventDefault();
        return;
      }
      if (!isDraggingRef.current || overlayVisible <= 0) return;

      const rect = svgEl.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      circle.attr('cx', x).attr('cy', y);
      dragTarget.attr('cx', x).attr('cy', y);

      // Intentionally NOT writing back to the store (one-shot init only)
    };

    onMaskReady?.();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    if (dragTargetNode) dragTargetNode.addEventListener('mousedown', handleMouseDown);

    setMaskReady(true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (dragTargetNode) dragTargetNode.removeEventListener('mousedown', handleMouseDown);
      d3.select(svgEl).selectAll('*').remove();
    };
  }

  useEffect(maskSetupEffect, []); // build once from seed

  // =========================
  // Mouse Move → Proximity Highlight (hover preview)
  // =========================
  function mouseMoveHintEffect() {
    if (!enabled) return;

    const handleMove = (e: MouseEvent) => {
      if (fadingOutRef.current || stopInteractivityRef.current) return;
      const { clientX: x, clientY: y } = e;

      const points = getZPoints();
      if (!points.length) return;

      let minDist = Infinity;
      let closestIndex: number | null = null;

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const dx = x - p.x;
        const dy = y - p.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < minDist) {
          minDist = d;
          closestIndex = i;
        }
      }

      const maxDist = 100;
      const raw = 1 - Math.pow(minDist / maxDist, 2);
      let val: number;
      if (raw <= 0) val = 0;
      else if (raw >= 0.1) val = 0.005;
      else val = raw;

      const HINT_MAX = 0.005;
      const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

      function setHint(v: number) {
        setOverlayVisible(clamp01(Math.min(v, HINT_MAX)));
      }

      setHint(val);

      if (closestIndex !== null && minDist < HOVER_THRESHOLD) {
        showPoiHole(points[closestIndex]);
      } else {
        clearPoiHole();
      }
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }

  useEffect(mouseMoveHintEffect, []); // keep original deps

  // =========================
  // Drag Reveal Logic (promote to persistent)
  // =========================
  function dragRevealEffect() {
    if (!enabled) return;

    const handleRevealCheck = () => {
      if (fadingOutRef.current || stopInteractivityRef.current) return;
      const node = trackerNodeRef.current;
      if (!node) return;

      if (!isDraggingRef.current) {
        clearPoiHole();
        return;
      }

      const sx = node.cx.baseVal.value;
      const sy = node.cy.baseVal.value;

      const points = getZPoints();
      if (!points.length) return;

      let minDist = Infinity;
      let closestIndex: number | null = null;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const d = Math.hypot(sx - p.x, sy - p.y);
        if (d < minDist) {
          minDist = d;
          closestIndex = i;
        }
      }

      if (closestIndex !== null && minDist < HOVER_THRESHOLD) {
        const hit = points[closestIndex];

        usePOIRevealStore.setState((s) => ({
          items: {
            ...s.items,
            [hit.name]: {
              ...s.items[hit.name],
              visible: true,
            },
          },
        }));
      } else {
        clearPoiHole();
      }
    };

    window.addEventListener('mousemove', handleRevealCheck);
    return () => window.removeEventListener('mousemove', handleRevealCheck);
  }

  useEffect(dragRevealEffect, []); // keep original deps

  // =========================
  // Render Persistent Revealed POIs (reactive)
  // =========================
  function persistentPoiEffect() {
    if (!enabled) return;
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const mask = svg.select('#spotlight-mask');

    let g = mask.select<SVGGElement>('#persistent-holes');
    if (g.empty()) g = mask.append('g').attr('id', 'persistent-holes');

    const points = zPoints.filter((p) => p.visible);

    const sel = g.selectAll<SVGImageElement, (typeof points)[number]>('image.persistent-hole').data(points, (d) => d.name as never);

    sel
      .enter()
      .append('image')
      .attr('class', 'persistent-hole')
      .merge(sel as never)
      .attr('href', (d) => d.src)
      .attr('x', (d) => d.x - d.w / 2)
      .attr('y', (d) => d.y - d.h / 2)
      .attr('width', (d) => d.w)
      .attr('height', (d) => d.h)
      .attr('preserveAspectRatio', 'xMidYMid meet')
      .style('filter', 'url(#alphaToBlack)');

    sel.exit().remove();
  }

  // Same data as getZPoints but driven by reactive subscription (for render)
  const zPoints: ZPoint[] = Object.values(items)
    .filter((i) => i.screenX != null && i.screenY != null)
    .map((i) => ({
      name: i.id,
      src: i.src,
      x: i.screenX as number,
      y: i.screenY as number,
      w: i.width ?? DEFAULT_HOLE_SIZE,
      h: i.height ?? DEFAULT_HOLE_SIZE,
      visible: !!i.visible,
    }));

  useEffect(persistentPoiEffect, [items, zPoints]); // keep original deps

  // =========================
  // Auto Finish (timer-based UX after all revealed)
  // =========================
  function finishTimerEffect() {
    if (!enabled) return;
    if (finishedRef.current) return;

    const points = getZPoints();
    if (!points.length) return;

    const allRevealed = points.every((p) => p.visible);
    if (!allRevealed) {
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
      return;
    }

    finishTimerRef.current = window.setTimeout(() => {
      finishedRef.current = true;
      setOverlayVisible(1);
      clearPoiHole();
      stopInteractivityRef.current = true;

      freezeUntilUpRef.current = true;
      document.body.classList.add('no-select');
      window.getSelection()?.removeAllRanges();
      isDraggingRef.current = false;
      if (dragTargetNodeRef.current) {
        dragTargetNodeRef.current.style.cursor = 'grab';
      }

      const release = () => {
        freezeUntilUpRef.current = false;
        document.body.classList.remove('no-select');
      };

      window.addEventListener('mouseup', release, { once: true });
      window.addEventListener('pointerup', release, { once: true });
    }, FINISH_DELAY_MS);

    return () => {
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }

  useEffect(finishTimerEffect, []); // keep original deps

  // =========================
  // Kill Spotlight when all visible (global switch)
  // =========================
  function killSpotlight(svgEl: SVGSVGElement | null) {
    if (!svgEl) {
      console.warn('[Kill] No SVG element passed');
      return;
    }

    const svgSel = d3.select(svgEl);

    svgSel.selectAll('#drag-target').remove();
    svgSel.selectAll('#spotlight-tracker').remove();
    svgSel.selectAll('#spotlight-mask').remove();
    svgSel.selectAll('rect[mask]').attr('mask', null);

    svgEl.style.pointerEvents = 'none';
    svgEl.style.cursor = 'auto';

    const wrap = svgEl.parentElement as HTMLElement | null;
    if (wrap) {
      wrap.style.pointerEvents = 'none';
      wrap.style.cursor = 'auto';
    }

    console.log('[Kill] Spotlight nuked');
  }

  const nukedRef = useRef(false);

  function startFadeOutAndKill() {
    if (fadingOutRef.current) return;
    fadingOutRef.current = true;

    // freeze interactivity immediately
    stopInteractivityRef.current = true;
    isDraggingRef.current = false;
    clearPoiHole();

    const svgSel = svgRef.current ? d3.select(svgRef.current) : null;
    svgSel?.select('#drag-target').style('pointer-events', 'none').style('cursor', 'auto');

    // tween overlayVisible -> 1, then kill
    const t0 = performance.now();
    const from = overlayVisible;
    const to = 1;

    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / FINAL_FADE_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      setOverlayVisible((prev) => Math.max(prev, from + (to - from) * eased));
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        const svgEl = svgRef.current;
        if (svgEl) killSpotlight(svgEl);
        nukedRef.current = true;
        useSpotlightMaskStore.getState().setEnabled(false);
      }
    };

    requestAnimationFrame(tick);
  }

  function killSpotlightEffect() {
    if (!enabled) return;
    if (nukedRef.current) return;

    const allVisible =
      Object.values(items).length > 0 && Object.values(items).every((i) => i.visible);

    // If not all visible yet, cancel any pending finish timer.
    if (!allVisible) {
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
        finishTimerRef.current = null;
      }
      return;
    }

    // All visible: if we haven't scheduled the finish yet, do it now.
    if (!fadingOutRef.current && !finishTimerRef.current) {
      finishTimerRef.current = window.setTimeout(() => {
        finishTimerRef.current = null;
        startFadeOutAndKill();
      }, FINISH_DELAY_MS);
    }
  }

  // important: watch 'items' (and enabled) so this responds when visibility changes
  useEffect(killSpotlightEffect, [enabled, items]);

  // =========================
  // Debug markers (optional overlay)
  // =========================
  type POI = { name: string; x: number; y: number; src: string; visible: boolean };
  const [markerPoints, setMarkerPoints] = useState<POI[]>([]);

  function debugMarkerEffect() {
    if (!enabled) return;
    let raf = 0;
    const tick = () => {
      setMarkerPoints(getZPoints());
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }

  useEffect(debugMarkerEffect, []); // keep original deps

  // =========================
  // Mount/unmount diagnostics
  // =========================
  const didInit = useRef(false);

  function mountLogEffect() {
    if (didInit.current) return;
    didInit.current = true;

    if (typeof window !== 'undefined') {
      (window as any)._spotlightSvgCount = ((window as any)._spotlightSvgCount ?? 0) + 1;
      console.log('svg instances:', (window as any)._spotlightSvgCount);
    }

    console.log('[Spotlight] mount');
    return () => {
      console.log('[Spotlight] unmount');
    };
  }

  useEffect(mountLogEffect, []); // keep original deps

  // =========================
  // After mask is ready, nudge overlay to enable interactivity
  // =========================
  function overlayNudgeEffect() {
    if (!enabled || !maskReady) return;
    setOverlayVisible((v) => (v === 1 ? 0.002 : v));
  }

  useEffect(overlayNudgeEffect, [enabled, maskReady]); // keep original deps

  // =========================
  // Render
  // =========================
  const wrapperPointerEvents =
    (DEBUG_FORCE_ON || enabled) && overlayVisible > 0.001 ? 'auto' : 'none';

  return (
    <>
      {/* Overlay / mask layer, middle */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          // when forcing on, don't fade the wrapper out
          opacity: DEBUG_FORCE_ON ? 1 : 1 - overlayVisible,
          pointerEvents: wrapperPointerEvents, // <-- stop intercepting when effectively hidden
          zIndex: DEBUG_FORCE_ON ? 999999 : 1,
          outline: DEBUG_FORCE_ON ? '2px dashed magenta' : undefined,
        }}
      >
        <svg ref={svgRef}></svg>
        {!maskReady && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#201e1f',
              zIndex: 1,
            }}
          />
        )}
      </div>

      {DEBUG_MARKERS && (
        <svg
          ref={svgRefMarkers}
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 2 }}
          width="100%"
          height="100%"
        >
          {markerPoints.map((p) => (
            <circle
              key={`poi-${p.name}`}
              cx={p.x}
              cy={p.y}
              r={8}
              fill="red"
              stroke="white"
              strokeWidth={2}
            />
          ))}

          {zPoints.map((p) => (
            <circle
              key={`z-${p.name}`}
              cx={p.x}
              cy={p.y}
              r={6}
              fill="lime"
              stroke="black"
              strokeWidth={1}
            />
          ))}
        </svg>
      )}
    </>
  );
}
