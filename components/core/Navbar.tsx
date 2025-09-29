'use client';

import {usePathname} from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {useState, useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';

export default function NavBar() {
    const pathname = usePathname();
    const isHome = pathname === '/' || pathname === '/premiere';

    const [logoState, setLogoState] = useState<
        'default' | 'wilted' | 'wateringRobot' | 'growing' | 'healthyPlant'
    >('default');

    const [hoverEnabled, setHoverEnabled] = useState(false);

    const logoMap = {
        default: '/assets/core/navbar/gabe_mcwilliams_logo_text_right_base.svg',
        wilted: '/assets/core/navbar/gabe_mcwilliams_logo_text_right_withered.svg',
        wateringRobot: '/assets/core/navbar/gabe_mcwilliams_logo_text_right_watered.svg',
        growing: '/assets/core/navbar/gabe_mcwilliams_logo_text_right_growing.svg',
        healthyPlant: '/assets/core/navbar/gabe_mcwilliams_logo_text_right_healthy.svg',
    };

    useEffect(() => {

        if (isHome) {
            const t = setTimeout(() => setHoverEnabled(true), 1000);
            return () => clearTimeout(t);

        } else {
            setHoverEnabled(false);
        }

    }, [isHome]);

    // --- Pin-to-logo measurements (top-left of the logo wrapper) ---
    const logoWrapRef = useRef<HTMLDivElement | null>(null);
    const [anchor, setAnchor] = useState<{ left: number; top: number } | null>(null);

    useEffect(() => {
        function measure() {
            const el = logoWrapRef.current;
            if (!el) return;
            const r = el.getBoundingClientRect();
            setAnchor({left: r.left, top: r.top});
        }

        measure();
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, {passive: true});

        return () => {
            window.removeEventListener('resize', measure);
            window.removeEventListener('scroll', measure);
        };
    }, []);

    // Reusable proximity zones rendered via portal (so they can spill into <main>)
    const zones =
        isHome && hoverEnabled && anchor
            ? createPortal(
                <div
                    // Fixed to viewport; pinned to logo's top-left
                    style={{
                        position: 'fixed',
                        left: anchor.left,
                        top: anchor.top,
                        width: 512,
                        height: 128,
                        zIndex: 1000, // above navbar
                    }}
                    onMouseLeave={() => setLogoState('default')}
                >
                    {/* Outermost proximity → wilted */}
                    <div
                        style={{
                            position: 'absolute',
                            left: -300,
                            top: -300,
                            width: 800,
                            height: 800,
                            zIndex: 10,
                            cursor: 'default',
                        }}
                        onMouseEnter={() => setLogoState('wilted')}
                    />
                    {/* Next → wateringRobot */}
                    <div
                        style={{
                            position: 'absolute',
                            left: -200,
                            top: -200,
                            width: 600,
                            height: 600,
                            zIndex: 20,
                            cursor: 'default',
                        }}
                        onMouseEnter={() => setLogoState('wateringRobot')}
                    />
                    {/* Next → growing */}
                    <div
                        style={{
                            position: 'absolute',
                            left: -100,
                            top: -100,
                            width: 400,
                            height: 400,
                            zIndex: 30,
                            cursor: 'default',
                        }}
                        onMouseEnter={() => setLogoState('growing')}
                    />
                    {/* Innermost → healthyPlant */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: 200,
                            height: 200,
                            zIndex: 40,
                            cursor: 'default',
                        }}
                        onMouseEnter={() => setLogoState('healthyPlant')}
                    />
                </div>,
                document.body
            )
            : null;

    return (
        <nav
            className="h-[16.66vh] bg-[var(--BG_NAVBAR)] text-[var(--BRAND_LEAF)] w-full px-6 flex pb-2 justify-between items-center sticky top-0 z-50">
            {/* Left: Logo (wrapper is the anchor for measuring) */}
            <div className="flex items-end gap-4 min-h-[10px] pl-4">
                <div ref={logoWrapRef} className="relative w-[512px] h-[128px]">
                    <Link href="/" className="
                        relative block w-[512px] h-[128px]
                    ">
                        <Image
                            src={logoMap[logoState]}
                            alt="Gabriel McWilliams Logo"
                            fill
                            priority
                            className="object-contain transition-opacity duration-300 ease-in-out"
                            sizes="(max-width: 768px) 100vw, 256px"
                        />
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


            {/* Proximity zones (portaled, fixed to viewport) */}
            {zones}
        </nav>
    );
}
