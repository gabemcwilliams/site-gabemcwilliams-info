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
  const isHome   = pathname === '/' || pathname === '/premiere';

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
  const LOGO_TEXT_SRC     = '/assets/logos/logo_text.svg';

  // ★ Compact mode toggle at the same threshold you use elsewhere
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const apply = () => setCompact(window.innerWidth < MIN_BALL_WIDTH);
    apply();
    window.addEventListener('resize', apply, { passive: true });
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
  const iconBoxRef  = useRef<HTMLDivElement | null>(null); // NEW: we anchor to this
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
  className={`h-[16.66vh] bg-[var(--BG_NAVBAR)] text-[var(--BRAND_LEAF)] w-full px-0 flex pb-0
    ${compact ? 'justify-start items-center pt-1' : 'justify-between items-center'}
    sticky top-0 z-50`}
  style={{
    ['--logo-h' as any]: 'clamp(56px, 12dvh, 128px)',
    ['--logo-scale' as any]: 'calc(var(--logo-h) / 128px)',
  }}
>

      {/* ★ COMPACT: only the combined logo, centered */}
{compact ? (
  <div className="flex items-start pl-4">
    <div className="relative" style={{ height: 'var(--logo-h)' }}>
      <div style={{ transform: 'scale(var(--logo-scale))', transformOrigin: 'left top' }}>
        <div ref={logoWrapRef} className="relative w-[512px] h-[128px]">
          <Link href="/" className="relative block w-full h-full" aria-label="Home">
            <Image
              src={LOGO_IMG_TEXT_SRC}
              alt="Gabriel McWilliams — Machine Learning & Edge AI"
              fill
              className="object-contain object-left-bottom"  // ← top-left inside the box
              sizes="420px"
              priority
            />
          </Link>
        </div>
      </div>
    </div>
  </div>
) : (
        /* ★ NON-COMPACT: your original left+right layout, untouched */
        <>
          {/* Left: Logo (keep your original DOM untouched; we only scale a wrapper) */}
          <div className="flex items-end gap-0 min-h-[10px] pl-16">
            {/* Reserve the desired height for layout */}
            <div className="relative" style={{height: 'var(--logo-h)'}}>
              {/* Scale the entire old block to match the reserved height */}
              <div style={{transform: 'scale(var(--logo-scale))', transformOrigin: 'left bottom'}}>
                <div ref={logoWrapRef} className="relative w-[512px] h-[128px]">
                  <Link href="/" className="relative block w-full h-full">
                    {/* ORIGINAL absolute row — unchanged */}
                    <div className="absolute inset-0 flex items-center gap-px">
                      {/* ICON box — unchanged */}
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
                          className="object-bottom [transform:scale(1.05)] transition-opacity duration-300 ease-in-out"
                          sizes="124px"
                        />
                      </div>

                      {/* TEXT box — unchanged */}
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
            </div>
          </div>

          {/* Right: Links */}
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

      {/* ★ Hide zones in compact to avoid weirdness */}
      {!compact && zones}
    </nav>
  );
}
