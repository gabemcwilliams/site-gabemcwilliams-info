// app/(showcase)/premiere/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMaskVisibilityStore } from '@/states/showcase/premiere/useMaskVisibilityStore';
import AppLayerSpotlight from '@/components/showcase/premiere/spotlight/AppLayerSpotlight';

// import SSRPreRenderMask from '@/components/showcase/premiere/spotlight/overlay/SSRPreRenderMask';
// import PremiereClient from './PremiereClient';

// Stage loads on the client only (no server HTML to flash)
const AppStageSettingLazy = dynamic(
  () => import('@/components/showcase/premiere/stage/AppStageSetting'),
  { ssr: false, loading: () => null }
);

export default function Premiere() {
  const spotlightOn = useMaskVisibilityStore((s) => s.enabled);

  // 1) maskReady flips when the masked rect has actually painted
  const [maskReady, setMaskReady] = useState(false);

  // 2) allowStageMount gates the actual mount (prevents any pre-paint)
  const [allowStageMount, setAllowStageMount] = useState(false);

  // 3) tiny hydration tick so the stage fade looks smooth
  const [stageHydrated, setStageHydrated] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setStageHydrated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // When the spotlight says it's ready, allow the stage to mount *next* paint
  const handleMaskReady = () => {
    // Two rAFs = guarantee the masked rect is on-screen before we reveal anything
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMaskReady(true);
        setAllowStageMount(true);
      });
    });
  };

  // Optional: start downloading the Stage bundle ASAP (still won’t mount until allowed)
  useEffect(() => {
    void import('@/components/showcase/premiere/stage/AppStageSetting');
  }, []);

  // =============== Styles ===============
  const rootStyle = useMemo<React.CSSProperties>(() => ({
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    background: "#201e1f",
  }), []);

  const overlayWrapperStyle = useMemo<React.CSSProperties>(() => ({
    position: 'fixed',
    inset: 0,
    zIndex: 1988, // < 2000 so your “home” icon remains above
    opacity: (spotlightOn || !maskReady) ? 1 : 0,
    pointerEvents: (spotlightOn || !maskReady) ? 'auto' : 'none',
    transition: maskReady ? 'opacity 800ms ease' : 'none',
  }), [spotlightOn, maskReady]);

  const stageFadeIn = stageHydrated && maskReady;
  const stageStyle = useMemo<React.CSSProperties>(() => ({
    position: 'absolute',
    inset: 0,
    zIndex: 0,
    display: allowStageMount ? 'block' : 'none', // no DOM until allowed
    opacity: stageFadeIn ? 1 : 0,
    transform: stageFadeIn ? 'none' : 'translateY(0.5vh) scale(0.995)',
    transition: 'opacity 260ms ease, transform 260ms ease',
    willChange: 'opacity, transform',
    pointerEvents: stageFadeIn ? 'auto' : 'none',
  }), [allowStageMount, stageFadeIn]);

  return (
    <div style={rootStyle}>
      {/* Spotlight overlay renders first and tells us when it has actually painted */}
      <div style={overlayWrapperStyle}>
        <AppLayerSpotlight initialOverlayVisible={1} onMaskReady={handleMaskReady} />
      </div>

      {/* Stage mounts only after the mask is visible; no SSR, no flash */}
      <div id="premiere-stage" style={stageStyle}>
        {allowStageMount ? <AppStageSettingLazy /> : null}
      </div>
    </div>
  );
}
