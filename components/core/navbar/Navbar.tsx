'use client';

import {usePathname} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {useState, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {useLogoAnchorStore} from '@/states/core/useLogoAnchorStore';

export default function NavBar() {



    const pathname = usePathname();
    const isHome = pathname === '/' || pathname === '/premiere';

    const [logoState, setLogoState] = useState<
        'default' | 'wilted' | 'wateringRobot' | 'growing' | 'healthyPlant'
    >('default');

    const [hoverEnabled, setHoverEnabled] = useState(false);

    const ICONS = {
        default: '/assets/core/navbar/logo_growing.svg',
        wilted: '/assets/core/navbar/logo_wilted.svg',
        wateringRobot: '/assets/core/navbar/logo_esp32_watering.svg',
        growing: '/assets/core/navbar/logo_growing.svg',
        healthyPlant: '/assets/core/navbar/logo_healthy.svg',
    } as const;

    const LOGO_TEXT_SRC = '/assets/core/navbar/logo_text.svg';

    useEffect(() => {
        if (isHome) {
            const t = setTimeout(() => setHoverEnabled(true), 1000);
            return () => clearTimeout(t);
        } else {
            setHoverEnabled(false);
        }
    }, [isHome]);

    // --- Measure logo (ICON) for the global anchor ---
    const logoWrapRef = useRef<HTMLDivElement | null>(null);
    const iconBoxRef = useRef<HTMLDivElement | null>(null); // NEW: we anchor to this
    const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);
    const setGlobalAnchor = useLogoAnchorStore((s) => s.setAnchor);

    useEffect(() => {
        let rafId: number | null = null;
        const snap = (v: number) => {
            const dpr = window.devicePixelRatio || 1;
            return Math.round(v * dpr) / dpr;
        };

        const measure = () => {
            const wrapEl = logoWrapRef.current;
            const iconEl = iconBoxRef.current ?? wrapEl;
            if (!iconEl) return;

            if (rafId != null) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const r = iconEl.getBoundingClientRect();

                const left = snap(r.left);
                const top = snap(r.top);
                const width = snap(r.width);
                const height = snap(r.height);

                    console.debug('[NavBar anchor]', { left, top, width, height, ts: Date.now() });
                setAnchor({left, top}); // local
                setGlobalAnchor({
                    left,
                    top,
                    width,
                    height,
                    centerX: left + width / 2,
                    centerY: top + height / 2,
                    ts: performance.now(),
                });


            });
        };

        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, {passive: true});
        const ro = new ResizeObserver(measure);
        if (logoWrapRef.current) ro.observe(logoWrapRef.current);
        if (iconBoxRef.current) ro.observe(iconBoxRef.current);



        return () => {
            if (rafId != null) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', measure);
            window.removeEventListener('scroll', measure);
            ro.disconnect();
            setGlobalAnchor(null);
        };
    }, [setGlobalAnchor]);


    const zones =
        isHome && hoverEnabled && anchor
            ? createPortal(
                <div
                    style={{
                        position: 'fixed',
                        left: anchor.left,
                        top: anchor.top,
                        width: 512,
                        height: 128,
                        zIndex: 1000,
                    }}
                    onMouseLeave={() => setLogoState('default')}
                >
                    <div
                        style={{
                            position: 'absolute',
                            left: -300,
                            top: -300,
                            width: 800,
                            height: 800,
                            zIndex: 10,
                            cursor: 'default'
                        }}
                        onMouseEnter={() => setLogoState('wilted')}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: -200,
                            top: -200,
                            width: 600,
                            height: 600,
                            zIndex: 20,
                            cursor: 'default'
                        }}
                        onMouseEnter={() => setLogoState('wateringRobot')}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: -100,
                            top: -100,
                            width: 400,
                            height: 400,
                            zIndex: 30,
                            cursor: 'default'
                        }}
                        onMouseEnter={() => setLogoState('growing')}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 200,
                            height: 200,
                            zIndex: 40,
                            cursor: 'default'
                        }}
                        onMouseEnter={() => setLogoState('healthyPlant')}
                    />
                </div>,
                document.body
            )
            : null;

    return (
        <nav
            className="h-[16.66vh] bg-[var(--BG_NAVBAR)] text-[var(--BRAND_LEAF)] w-full px-0 flex pb-0 justify-between items-center sticky top-0 z-50">
            {/* Left: Logo (wrapper exists only to reserve space; we anchor to the ICON box) */}
            <div className="flex items-end gap-0 min-h-[10px] pl-16">
                <div ref={logoWrapRef} className="relative w-[512px] h-[128px]">
                    <Link href="/" className="relative block w-full h-full">
                        {/* Row with tiny gap; children same height */}
                        <div className="absolute inset-0 flex items-center gap-px">
                            {/* ICON box — measure/store this */}
                            <div
                                ref={iconBoxRef}
                                data-anchor="icon"
                                className="relative h-[152px] w-[152px] shrink-0 overflow-hidden translate-y-[-10px] translate-x-[30px] p-0"
                            >
                                <Image
                                    src={ICONS[logoState]}
                                    alt="Logo icon"
                                    fill
                                    priority
                                    // Bottom-align and allow overflow (cropped at top)
                                    className=" object-bottom [transform:scale(1.05)] transition-opacity duration-300 ease-in-out"

                                    sizes="124px"
                                />
                            </div>


                            {/* TEXT box — same height; adjust if you want the text slightly shorter */}
                            <div className="relative h-[128px] flex-1">
                                <Image
                                    src={LOGO_TEXT_SRC}
                                    alt="Gabriel McWilliams — Machine Learning & Edge AI"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 768px) 300px, (max-width: 1024px) 360px, 420px"
                                    priority={false}
                                />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Right: Links */}
            <div className="hidden md:flex items-end h-24 gap-10 text-sm font-semibold tracking-wide pr-24">
                <Link
                    href="/about"
                    className="hover:text-[var(--BRAND_ROBOT)] text-xl hover:scale-[1.005] transition-transform duration-150 hover:drop-shadow-[var(--BRAND_ROBOT)]"
                >
                    About me
                </Link>
                <span className="text-[var(--BRAND_LEAF_DIM)]">·</span>
                <Link
                    href="/contact"
                    className="hover:text-[var(--BRAND_ROBOT)] text-xl hover:scale-[1.005] transition-transform duration-150 hover:drop-shadow-[var(--BRAND_ROBOT)]"
                >
                    Let’s Talk
                </Link>
            </div>

            {zones}
        </nav>
    );
}
