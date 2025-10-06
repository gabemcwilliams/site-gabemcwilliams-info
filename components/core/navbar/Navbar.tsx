'use client';

import {usePathname} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {useState, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {useLogoAnchorStore} from '@/states/core/useLogoAnchorStore';

import HamburgerMenu from '@/components/core/navbar/HamburgerMenu'

export default function NavBar() {

    const MIN_BALL_WIDTH = 1297;

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

    const LOGO_IMG_TEXT_SRC = '/assets/logos/logo_img_text.svg';
    const LOGO_TEXT_SRC = '/assets/logos/logo_text.svg';

    // ★ Compact mode toggle at the same threshold you use elsewhere
    const [compact, setCompact] = useState(false);
    useEffect(() => {
        const apply = () => setCompact(window.innerWidth < MIN_BALL_WIDTH);
        apply();
        window.addEventListener('resize', apply, {passive: true});
        return () => window.removeEventListener('resize', apply);
    }, []);

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

                console.debug('[NavBar anchor]', {left, top, width, height, ts: Date.now()});
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
            className={`h-[16.66vh] bg-[var(--BG_NAVBAR)] text-[var(--BRAND_LEAF)] w-full px-0 flex
      ${compact ? 'justify-start items-center' : 'justify-between items-center'}
      sticky top-0 z-50`}
            style={{
                // drives the target logo height everywhere
                ['--logo-h' as any]: 'clamp(56px, 12dvh, 128px)',
            }}
        >
            {/* COMPACT: show only the combined mark; position at top-left */}
            {compact ? (
                <div className="flex items-start pl-4">
                    <div
                        ref={logoWrapRef}
                        className="relative"
                        style={{
                            height: 'var(--logo-h)',
                            // Use your combined SVG viewBox (width / height)
                            aspectRatio: '5000 / 1557', // logo_img_text.svg
                        }}
                    >
                        <Link href="/" className="relative block w-full h-full" aria-label="Home">
                            <Image
                                src={LOGO_IMG_TEXT_SRC}
                                alt="Gabriel McWilliams — Machine Learning & Edge AI"
                                fill
                                className="object-left-top"
                                sizes="420px"
                                priority
                            />
                        </Link>
                    </div>
                </div>
            ) : (
                <>
                    {/* Left: icon + text (real layout; no transforms) */}
                    <div className="flex items-end gap-1 min-h-[10px] pl-16">
                        <div className="relative" style={{height: 'var(--logo-h)'}}>
                            <Link href="/" className="relative block h-full">
                                <div className="flex items-end h-full min-w-0 gap-1">
                                    {/* ICON (anchor box) */}
                                    <div
                                        ref={iconBoxRef}
                                        data-anchor="icon"
                                        className="relative shrink-0 overflow-hidden"
                                        style={{width: 'var(--logo-h)', height: 'var(--logo-h)'}}
                                    >
                                        <Image
                                            src={ICONS[logoState]}
                                            alt="Logo icon"
                                            fill
                                            priority
                                            className="object-left-bottom transition-opacity duration-300 ease-in-out"
                                            sizes="128px"
                                        />
                                    </div>

                                    {/* TEXT — same visual height as icon, correct width via aspect ratio */}
                                    <div
                                        className="relative shrink-0 overflow-hidden"
                                        style={{
                                            height: 'calc(var(--logo-h) * 0.84)',
                                            // Use your text SVG viewBox (width / height)
                                            aspectRatio: '5000 / 1614', // logo_text.svg
                                        }}
                                    >
                                        <Image
                                            src={LOGO_TEXT_SRC}
                                            alt="Gabriel McWilliams — Machine Learning & Edge AI"
                                            fill
                                            className="object-left-bottom"
                                            sizes="420px"
                                        />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Right: Links (unchanged) */}
                    <div className="hidden md:flex items-end h-24 gap-10 text-sm font-semibold tracking-wide pr-52">
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
                </>
            )}

            {/* Avoid hover zones in compact */}
            {!compact && zones}
        </nav>
    );
}
