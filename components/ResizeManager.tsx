'use client';
import { useLayoutEffect } from 'react';
import { useResizeStore } from '@/states/useResizeProvider';

export function ResizeManager() {
  const setAll = useResizeStore((s) => s.setAll);

  useLayoutEffect(() => {
    const update = () => setAll(window.innerWidth, window.innerHeight);
    update(); // set before first paint
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, [setAll]);

  return null;
}
