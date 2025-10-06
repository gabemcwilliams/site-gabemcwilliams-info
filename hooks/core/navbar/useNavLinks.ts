'use client';

import { useEffect, useState } from 'react';

export type NavLinkItem = {
  label: string;
  href: string;
  external?: boolean;
};

export function useNavLinks(url: string = '/nav-links.json') {
  const [links, setLinks] = useState<NavLinkItem[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
        const data = (await res.json()) as NavLinkItem[];
        if (alive) setLinks(data);
      } catch (e: any) {
        if (alive) setError(e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [url]);

  return { links, error, loading };
}
