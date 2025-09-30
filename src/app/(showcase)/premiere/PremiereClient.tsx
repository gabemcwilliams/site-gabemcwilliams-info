'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMaskVisibilityStore } from '@/states/showcase/premiere/useMaskVisibilityStore';
import AppLayerSpotlight from '@/components/showcase/premiere/spotlight/AppLayerSpotlight';

const AppStageSettingLazy = dynamic(
  () => import('@/components/showcase/premiere/stage/AppStageSetting'),
  { ssr: false, loading: () => null }
);

export default function PremiereClient() {
  const spotlightOn = useMaskVisibilityStore((s) => s.enabled);

  const [maskReady, setMaskReady] = useState(false);
  const [allowStageMount, setAllowStageMount] = useState(false);
  const [stageHydrated, setStageHydrated] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setStageHydrated(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // When the live spotlight is really on-screen, mark mask-ready → CSS fades SSR mask
  const handleMaskReady = () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setMaskReady(true);
        setAllowStageMount(true);
        // One more frame ensures the live overlay is settled under the SSR mask
        requestAnimationFrame(() => {
          document.documentElement.classList.add('mask-ready');
        });
      });
    });
  };

  useEffect(() => {
    void import('@/components/showcase/premiere/stage/AppStageSetting');
  }, []);

  // Styles (unchanged except: keep your gradient if you want)
  const rootStyle = useMemo<React.CSSProperties>(() => ({
    position: 'relative',
    height: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(to bottom, black 1%, #623516 100%)',
  }), []);

  const overlayWrapperStyle = useMemo<React.CSSProperties>(() => ({
    position: 'fixed',
    inset: 0,
    zIndex: 1988, // SSR mask sits above this at 1995
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
      {/* Live overlay under the SSR placeholder */}
      <div style={overlayWrapperStyle}>
        <AppLayerSpotlight initialOverlayVisible={1} onMaskReady={handleMaskReady} />
      </div>

      <div id="premiere-stage" style={stageStyle}>
        {allowStageMount ? <AppStageSettingLazy /> : null}
      </div>
    </div>
  );
}
