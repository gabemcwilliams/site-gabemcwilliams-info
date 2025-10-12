// app/(showcase)/premiere/page.tsx
'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {useRouter} from "next/navigation";
import dynamic from 'next/dynamic';
import AppLayerSpotlight from '@/components/showcase/premiere/spotlight/AppLayerSpotlight';
import {useSpotlightMaskStore} from '@/states/showcase/premiere/useSpotlightMaskStore';
import {usePOIRevealStore} from '@/states/showcase/premiere/usePOIRevealStore';

// === Route-specific default for reload / deep-link ===
const PREMIERE_DEFAULT = {cx: 870, cy: 360, r: 64};
// Start enabled on hard reload/deep link
const ENABLE_ON_RELOAD = true;

// ---------- tiny browser guards ----------
const isBrowser = () => typeof window !== 'undefined';

const getNavType = (): PerformanceNavigationTiming['type'] | undefined => {
    try {
        if (!isBrowser() || typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
            return undefined;
        }
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        return nav?.type;
    } catch {
        return undefined;
    }
};

const ssGet = (k: string): string | null => {
    try {
        return isBrowser() ? window.sessionStorage.getItem(k) : null;
    } catch {
        return null;
    }
};

const ssRemove = (k: string) => {
    try {
        if (isBrowser()) window.sessionStorage.removeItem(k);
    } catch {
        /* ignore */
    }
};

// ---------- compute initial mask for this mount (sync, before children render) ----------
function useInitialPremiereMask() {
    const evalRef = useRef(false);
    const initialRef = useRef<{ cx?: number; cy?: number; r?: number } | null>(null);

    if (!evalRef.current) {
        evalRef.current = true;

        const isReload = getNavType() === 'reload';
        const cameFromLanding = ssGet('cameFromLanding') === '1';

        if (isReload || !cameFromLanding) {
            // Deep link / hard reload → use route defaults
            initialRef.current = {...PREMIERE_DEFAULT};
        } else {
            // SPA handoff → let AppLayerSpotlight consume seed from store
            initialRef.current = null;
        }

        // one-shot
        ssRemove('cameFromLanding');
    }

    return initialRef.current;
}

// ---------- Reset progress only on reload/deep-link (not mask coords) ----------
function useResetGameOnReloadOrDeepLink() {
    const ran = useRef(false);

    useEffect(() => {
        if (ran.current) return;
        ran.current = true;

        const isReload = getNavType() === 'reload';
        const cameFromLanding = ssGet('cameFromLanding') === '1';

        if (isReload || !cameFromLanding) {
            // Reset only POI progress (keep spotlight coords/size)
            // If you implemented resetProgress() use that; otherwise call your reset()
            // Example (choose one you have):
            // usePOIRevealStore.getState().resetProgress?.();
            usePOIRevealStore.getState().reset?.();

            // Don’t recenter mask; only ensure enabled state
            useSpotlightMaskStore.getState().setEnabled(ENABLE_ON_RELOAD);
        }

        ssRemove('cameFromLanding');
    }, []);
}

// Stage loads on the client only (no SSR flash)
const AppStageSettingLazy = dynamic(
    () => import('@/components/showcase/premiere/stage/AppStageSetting'),
    {ssr: false, loading: () => null}
);

export default function Premiere() {
    const router = useRouter(); //

    //  WIDTH GATE — runs before anything heavy mounts
    useEffect(() => {
        const MIN_WIDTH = 1024;                 // set your threshold here
        if (window.innerWidth < MIN_WIDTH) {
            router.replace('/');                  // bounce home if too small
        }
    }, [router]);

    const spotlightOn = useSpotlightMaskStore((s) => s.enabled);

    // Seed/reset policy
    const initialMask = useInitialPremiereMask();
    useResetGameOnReloadOrDeepLink();


    // 1) maskReady flips when the masked rect has actually painted
    const [maskReady, setMaskReady] = useState(false);

    // 2) gate Stage mount until mask is present (prevents pre-paint)
    const [allowStageMount, setAllowStageMount] = useState(false);

    // 3) tiny hydration tick so the stage fade looks smooth
    const [stageHydrated, setStageHydrated] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setStageHydrated(true));
        return () => cancelAnimationFrame(id);
    }, []);

    const handleMaskReady = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setMaskReady(true);
                setAllowStageMount(true);
            });
        });
    };

    // Optional: prefetch the Stage bundle ASAP
    useEffect(() => {
        void import('@/components/showcase/premiere/stage/AppStageSetting');
    }, []);

    // =============== Styles ===============
    const rootStyle = useMemo<React.CSSProperties>(() => ({
        position: 'relative',
        height: '100vh',
        overflow: 'hidden',
        background: '#201e1f',
    }), []);

    const overlayWrapperStyle = useMemo<React.CSSProperties>(() => ({
        position: 'fixed',
        inset: 0,
        zIndex: 1988, // keep below home icon
        opacity: (spotlightOn || !maskReady) ? 1 : 0,
        pointerEvents: (spotlightOn || !maskReady) ? 'auto' : 'none',
        transition: maskReady ? 'opacity 800ms ease' : 'none',
    }), [spotlightOn, maskReady]);

    const stageFadeIn = stageHydrated && maskReady;
    const stageStyle = useMemo<React.CSSProperties>(() => ({
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        display: allowStageMount ? 'block' : 'none',
        opacity: stageFadeIn ? 1 : 0,
        transform: stageFadeIn ? 'none' : 'translateY(0.5vh) scale(0.995)',
        transition: 'opacity 260ms ease, transform 260ms ease',
        willChange: 'opacity, transform',
        pointerEvents: stageFadeIn ? 'auto' : 'none',
    }), [allowStageMount, stageFadeIn]);

    return (
        <div style={rootStyle}>
            <div style={overlayWrapperStyle}>
                <AppLayerSpotlight
                    initialOverlayVisible={1}
                    onMaskReady={handleMaskReady}
                    // On SPA push from Landing: `initialMask` is null → component consumes seed from store.
                    // On reload/deep-link: pass explicit defaults so the circle starts where it belongs.
                    initiallyEnabled={initialMask ? ENABLE_ON_RELOAD : undefined}
                />
            </div>

            {/* Stage mounts only after the mask is visible; no SSR, no flash */}
            <div id="premiere-stage" style={stageStyle}>
                {allowStageMount ? <AppStageSettingLazy/> : null}
            </div>
        </div>
    );
}
