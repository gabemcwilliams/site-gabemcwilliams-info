'use client';

import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {usePOIRevealStore} from '@/states/showcase/premiere/usePOIRevealStore';

type RingSpec = {
  z: number;
  opacity: number;
  heightVh: number;   // fallback if not measured yet
  bottomVh: number;
  filter?: string;
  width?: number | string; // allow px/%, etc. (optional override)
};

type FlameSpec = {
  heightVh: number;
  bottomVh: number;
  opacity: number;
  altChance: number;
  minSwapMs: number;
  maxSwapMs: number;
};

export interface CampfireProps {
  ring?: Partial<RingSpec>;
  visible?: boolean;
  zIndex?: number;
  publishToStore?: boolean;
}

const RING_SRC = '/assets/showcase/premiere/stage_setting/campfire/campfire_ring.svg';

const CORE_FLAMES = [
  '/assets/showcase/premiere/stage_setting/campfire/flame_1.svg',
  '/assets/showcase/premiere/stage_setting/campfire/flame_2.svg',
  '/assets/showcase/premiere/stage_setting/campfire/flame_3.svg',
  '/assets/showcase/premiere/stage_setting/campfire/flame_4.svg',
] as const;

const ALT_FLAMES = [
  '/assets/showcase/premiere/stage_setting/campfire/flame_alt_1.svg',
  '/assets/showcase/premiere/stage_setting/campfire/flame_alt_2.svg',
] as const;

// Kept only ≥1024 tiers
const BP_XL  = 1280;
const BP_2XL = 1536;

function computeRing(vw: number): RingSpec {
  // < 1280 (below XL)
  if (vw < BP_XL) {
    return { z: 100, opacity: 1, heightVh: 12, bottomVh: 26, width: 180 };
  }
  // 1280–1535 (XL)
  if (vw < BP_2XL) {
    return { z: 100, opacity: 1, heightVh: 12, bottomVh: 22, width: 220 };
  }
  // ≥ 1536 (2XL+)
  return { z: 100, opacity: 1, heightVh: 12, bottomVh: 18, width: 280 };
}

function Campfire({
  visible = true,
  ring: ringOverride,
  zIndex,
  publishToStore = true,
}: CampfireProps) {
  if (!visible) return null;

  // viewport width (SSR-safe default)
  const [vw, setVw] = useState(1280);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ring spec with overrides
  const ring: RingSpec = useMemo(() => {
    const base = computeRing(vw);
    return {
      ...base,
      ...ringOverride,
      heightVh: ringOverride?.heightVh ?? base.heightVh,
      bottomVh: ringOverride?.bottomVh ?? base.bottomVh,
      opacity: ringOverride?.opacity ?? base.opacity,
      z: ringOverride?.z ?? base.z,
      filter: ringOverride?.filter ?? base.filter,
      width: ringOverride?.width ?? base.width,
    };
  }, [vw, ringOverride]);

  // preload
  useEffect(() => {
    [RING_SRC, ...CORE_FLAMES, ...ALT_FLAMES].forEach((src) => {
      const i = new Image();
      i.src = src;
    });
  }, []);

  // motion pref
  const prefersReduced = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    prefersReduced.current = !!mq?.matches;
    const onChange = (e: MediaQueryListEvent) => { prefersReduced.current = e.matches; };
    mq?.addEventListener?.('change', onChange);
    return () => mq?.removeEventListener?.('change', onChange);
  }, []);

  // ring measurement (in vh)
  const ringImgRef = useRef<HTMLImageElement | null>(null);
  const [ringVh, setRingVh] = useState<number | null>(null);

  const measureRing = () => {
    const el = ringImgRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = (rect.height / window.innerHeight) * 100;
    setRingVh(vh);
  };

  useEffect(() => {
    const onResize = () => requestAnimationFrame(measureRing);
    window.addEventListener('resize', onResize);
    requestAnimationFrame(measureRing);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const el = ringImgRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureRing());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // flames: derive from measured ring height (fallback to ring.heightVh)
  const flame: FlameSpec = useMemo(() => {
    const R = ringVh ?? ring.heightVh;
    const lift = 0.75 * R;
    return {
      heightVh: 4 * R,
      bottomVh: ring.bottomVh + lift,
      opacity: 0.65,
      altChance: 0.14,
      minSwapMs: 700,
      maxSwapMs: 1900,
    };
  }, [ringVh, ring.bottomVh, ring.heightVh]);

  // crossfade sprites
  const [frontIdx, setFrontIdx] = useState(0);
  const [imgs, setImgs] = useState<[string, string]>([
    CORE_FLAMES[0],
    CORE_FLAMES[0],
  ]);
  const frontIdxRef = useRef(frontIdx);
  useEffect(() => { frontIdxRef.current = frontIdx; }, [frontIdx]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const pickNext = () => {
      const useAlt = Math.random() < flame.altChance;
      const pool = useAlt ? ALT_FLAMES : CORE_FLAMES;
      return pool[Math.floor(Math.random() * pool.length)];
    };

    const loop = () => {
      if (prefersReduced.current) {
        timer = setTimeout(loop, 2000);
        return;
      }
      const back = 1 - frontIdxRef.current;
      const nextSrc = pickNext();

      setImgs((prev) => {
        const out = [...prev] as [string, string];
        out[back] = nextSrc;
        return out;
      });

      requestAnimationFrame(() => setFrontIdx(back));

      const delay = flame.minSwapMs + Math.random() * Math.max(0, flame.maxSwapMs - flame.minSwapMs);
      timer = setTimeout(loop, delay);
    };

    timer = setTimeout(loop, 700);
    return () => { if (timer) clearTimeout(timer); };
  }, [flame.minSwapMs, flame.maxSwapMs, flame.altChance]);

  // styles
  const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

  const ringStyle: CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: `${ring.bottomVh}vh`,
    width: ring.width ?? 'auto',
    height: ring.width ? 'auto' : `${ring.heightVh}vh`,
    display: 'block',
    objectFit: 'contain',
    pointerEvents: 'none',
    opacity: ring.opacity,
    filter: ring.filter,
    zIndex: (ring.z ?? 100) + 1,
    transition: `opacity 320ms ${EASE}`,
  };

  const flameBase: CSSProperties = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: `${flame.bottomVh}vh`,
    height: `${flame.heightVh}vh`,
    width: 'auto',
    display: 'block',
    objectFit: 'contain',
    pointerEvents: 'none',
    opacity: flame.opacity,
    filter: ring.filter,
    transition: `opacity 520ms ${EASE}, transform 520ms ${EASE}`,
    willChange: 'opacity, transform',
    zIndex: ring.z ?? 100,
  };

  // publish to store using the front flame’s rect
  const flameARef = useRef<HTMLImageElement | null>(null);
  const flameBRef = useRef<HTMLImageElement | null>(null);

  const measureFlame = () => {
    if (!publishToStore) return;
    const idx = frontIdxRef.current;
    const flameEl = idx === 0 ? flameARef.current : flameBRef.current;
    if (!flameEl) return;
    const rect = flameEl.getBoundingClientRect();
    usePOIRevealStore.setState((s) => ({
      items: {
        ...s.items,
        fire: {
          ...s.items.fire,
          id: 'fire',
          src: imgs[idx],
          screenX: rect.left + rect.width / 2,
          screenY: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height,
          visible: s.items.fire?.visible ?? false,
        },
      },
    }));
  };

  const onImgLoad = () => { requestAnimationFrame(measureFlame); };

  useEffect(() => { requestAnimationFrame(measureFlame); }, [
    frontIdx,
    ring.bottomVh,
    ring.heightVh,
    ring.width,
    flame.bottomVh,
    flame.heightVh,
    publishToStore,
  ]);

  useEffect(() => {
    const onResize = () => requestAnimationFrame(measureFlame);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [publishToStore]);

  useEffect(() => {
    if (!publishToStore) return;
    const el = frontIdx === 0 ? flameARef.current : flameBRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measureFlame());
    ro.observe(el);
    return () => ro.disconnect();
  }, [frontIdx, publishToStore]);

  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex, pointerEvents: 'none' }}>
      {/* Flames (crossfade) */}
      <img
        ref={flameARef}
        src={imgs[0]}
        alt="Campfire flame A"
        style={{ ...flameBase, opacity: frontIdx === 0 ? flame.opacity : 0 }}
        draggable={false}
        decoding="async"
        loading="eager"
        onLoad={onImgLoad}
      />
      <img
        ref={flameBRef}
        src={imgs[1]}
        alt="Campfire flame B"
        style={{ ...flameBase, opacity: frontIdx === 1 ? flame.opacity : 0 }}
        draggable={false}
        decoding="async"
        loading="eager"
        onLoad={onImgLoad}
      />

      {/* Rock ring (visual anchor) */}
      <img
        ref={ringImgRef}
        src={RING_SRC}
        alt="Campfire rock ring"
        style={ringStyle}
        draggable={false}
        decoding="async"
        loading="eager"
        onLoad={() => {
          requestAnimationFrame(measureRing);
          onImgLoad();
        }}
      />
    </div>
  );
}

export default memo(Campfire);
