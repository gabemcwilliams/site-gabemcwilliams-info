// useMountCounter.ts
'use client';
import { useEffect, useRef } from 'react';

export function useMountCounter(name: string) {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (typeof window !== 'undefined') {
      (window as any).__mounts ??= {};
      (window as any).__mounts[name] = ((window as any).__mounts[name] ?? 0) + 1;
      console.log(`[mount] ${name} #${(window as any).__mounts[name]}`);
    } else {
      console.log(`[mount:ssr] ${name}`);
    }

    return () => console.log(`[unmount] ${name}`);
  }, []);
}
