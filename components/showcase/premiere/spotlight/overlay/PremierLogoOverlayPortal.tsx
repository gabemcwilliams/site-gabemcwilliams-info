'use client';
import {useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import * as d3 from 'd3';
import Image from 'next/image';
import Link from 'next/link';
import {useMaskVisibilityStore} from '@/states/showcase/premiere/useMaskVisibilityStore';

export default function PremierLogoOverlayPortal() {

    const DURATION = 700;

    const pathname = usePathname();
    const spotlightOn = useMaskVisibilityStore(s => s.enabled);

    const logoRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);

    // Mount flag
    useEffect(() => {
        setMounted(true);
        return () => {
            setMounted(false);
        };
    }, []);

    // Cleanup when spotlight turns off (but the hook still runs)
    useEffect(() => {
        if (!spotlightOn) {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            d3.select('#overlay-svg').remove();
            setVisible(false);
        }
    }, [spotlightOn]);

    // RAF loop (guarded)
    useEffect(() => {
        if (!mounted || !spotlightOn) return;

        const loop = () => {
            const maskEl = document.getElementById('spotlight-tracker') as SVGCircleElement | null;
            const logoEl = logoRef.current;

            if (!logoEl || !maskEl) {
                setVisible(false);
            } else {
                const r = parseFloat(maskEl.getAttribute('r') || '0');
                const cx = parseFloat(maskEl.getAttribute('cx') || '0');
                const cy = parseFloat(maskEl.getAttribute('cy') || '0');
                const box = logoEl.getBoundingClientRect();
                const lx = box.left + box.width / 2;
                const ly = box.top + box.height / 2;
                const dist = Math.hypot(cx - lx, cy - ly);
                setVisible(dist > (r + 150));
            }

            rafRef.current = requestAnimationFrame(loop);
        };

        rafRef.current = requestAnimationFrame(loop);
        return () => {
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        };
    }, [mounted, spotlightOn]);

    const handleClick = () => {
        if (pathname === '/') return;
        const el = logoRef.current;
        if (!el) return;

        const box = el.getBoundingClientRect();
        const cx = box.left + box.width / 2;
        const cy = box.top + box.height / 2;

        d3.select('#overlay-svg').remove();

        const svg = d3.select('body')
            .append('svg')
            .attr('id', 'overlay-svg')
            .style('position', 'fixed')
            .style('top', 0)
            .style('left', 0)
            .style('width', '100vw')
            .style('height', '100vh')
            .style('pointer-events', 'none')
            .style('z-index', '7777');


        svg.append('rect')

            .attr('x', cx - 256)
            .attr('y', cy - 72)
            .attr('width', 1024)
            .attr('height', 164)
            .attr('fill', '#201e1f')
            .attr('opacity', 1)


            .transition()
            .duration(DURATION)
            .ease(d3.easeCubicOut)
            .attr('opacity', 0);

        setTimeout(() => d3.select('#overlay-svg').remove(), DURATION + 40);
    };


    if (!mounted || !spotlightOn) return null;

    return createPortal(
        <div
            ref={logoRef}
            style={{
                position: 'fixed',
                top: '6rem',
                left: '8rem',
                zIndex: 9999,
                pointerEvents: visible ? 'auto' : 'none',
                opacity: visible ? 1 : 0,
            }}
        >
            <Link href="/" onClick={handleClick}>
                <Image
                    tabIndex={-1}
                    className="select-none focus:outline-none cursor-pointer"
                    src="/assets/logos/base_tree_favicon_transparent_bg.svg"
                    alt="Home"
                    width={50}
                    height={50}
                    style={{width: 50, height: 50}}
                    priority
                />
            </Link>
        </div>,
        document.body
    );
}
