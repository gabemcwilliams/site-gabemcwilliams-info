'use client';

import React, {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import * as d3 from 'd3';

type Props = {
    /** Logo image path (public/) */
    logoSrc?: string;
    /** Fixed position of the logo */
    logoTop?: string | number;   // e.g. '6rem'
    logoLeft?: string | number;  // e.g. '8rem'
    /** Dark overlay fill used by the mask */
    overlayColor?: string;       // e.g. '#252525'
    /** Extra distance outside the spotlight before showing the logo */
    revealMarginPx?: number;     // e.g. 150
    /** z-index for the overlay + logo wrapper */
    zIndex?: number;             // default 2147483646
};

export default function CoreLogoOverlayPortal(
    {
        logoSrc = '/assets/logos/base_tree_favicon_transparent_bg.svg',
        logoTop = '6rem',
        logoLeft = '8rem',
        overlayColor = '#252525',
        revealMarginPx = 150,
        zIndex = 2147483646,
    }: Props) {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const overlayRectRef = useRef<SVGRectElement | null>(null);
    const trackerRef = useRef<SVGCircleElement | null>(null);
    const logoRef = useRef<HTMLDivElement | null>(null);

    const rafRef = useRef<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [logoVisible, setLogoVisible] = useState(false);


    // Mount portal root
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Build global mask svg+defs+overlay once
    useEffect(() => {
        if (!mounted) return;

        // Create the SVG in a portal target
        const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.setAttribute('id', 'global-mask-svg');
        svgEl.style.position = 'fixed';
        svgEl.style.inset = '0';
        svgEl.style.width = '100vw';
        svgEl.style.height = '100vh';
        svgEl.style.pointerEvents = 'none';
        svgEl.style.zIndex = String(zIndex);
        document.body.appendChild(svgEl);
        svgRef.current = svgEl;

        // D3 handle
        const svg = d3.select(svgEl);

        // Prepare defs + mask
        const defs = svg.append('defs');
        const mask = defs.append('mask').attr('id', 'shrink-mask');

        // Base white rect (overlay visible everywhere)
        mask
            .append('rect')
            .attr('width', window.innerWidth)
            .attr('height', window.innerHeight)
            .attr('fill', 'white');

        // Black circle (the "hole") — IMPORTANT ID
        const tracker = mask
            .append('circle')
            .attr('id', 'spotlight-tracker')
            .attr('cx', window.innerWidth / 2)
            .attr('cy', window.innerHeight / 2)
            .attr('r', Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2)) // start huge
            .attr('fill', 'black');

        trackerRef.current = tracker.node() as SVGCircleElement;

        // Overlay rect that the mask cuts through
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

        // Resize handler to keep sizing accurate
        const onResize = () => {
            if (!svgRef.current) return;
            d3.select(overlayRectRef.current)
                .attr('width', window.innerWidth)
                .attr('height', window.innerHeight);

            const t = d3.select(trackerRef.current);
            // keep radius at least as big as diagonal to ensure “fully covered” when expanding
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

    // RAF loop — show logo only when **outside** the spotlight
    useEffect(() => {
        if (!mounted) return;

        const loop = () => {
            let tracker = trackerRef.current;

            // Re-resolve the spotlight circle if our cached node is gone or replaced

            if (!tracker || !(tracker as any).isConnected) {
                tracker = document.getElementById('spotlight-tracker') as SVGCircleElement | null;
                trackerRef.current = tracker;
            }

            const logoEl = logoRef.current;
            if (!tracker || !logoEl) {
                setLogoVisible(false);
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
            setLogoVisible(dist > (r + revealMarginPx));

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [mounted, revealMarginPx]);

    if (!mounted) return null;

    // Portal SVG (already appended directly), we only portal the logo wrapper
    return createPortal(
        <div
            ref={logoRef}
            style={{
                position: 'fixed',
                top: typeof logoTop === 'number' ? `${logoTop}px` : logoTop,
                left: typeof logoLeft === 'number' ? `${logoLeft}px` : logoLeft,
                zIndex: zIndex + 1,
                pointerEvents: 'none',
                opacity: logoVisible ? 1 : 0,
                transition: 'opacity 50ms ease',
            }}
            aria-hidden={!logoVisible}
        >
            <img
                src={logoSrc}
                role="presentation"
                style={{width: 50, height: 50, userSelect: 'none'}}
                draggable={false}
                alt={'Logo Placeholder - Not Interactable'}/>
        </div>,
        document.body
    );
}
