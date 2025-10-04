// hooks/useStageGroundSizeClass.ts

import { useState, useEffect } from 'react';

/**
 * Responsive viewport classification hook.
 *
 * Currently used by stage-layer components like:
 *   - Rocks.tsx
 *   - Cacti.tsx
 *   - Grass.tsx
 *
 * Returns one of:
 *   'mobile'    → < 600px
 *   'desktop'   → 600px–1980px
 *   'ultrawide' → > 1980px
 */
export type useStageGroundSizeClass = 'mobile' | 'desktop' | 'ultrawide';

export function useStageGroundSizeClass(): useStageGroundSizeClass {
  const [vp, setVp] = useState<useStageGroundSizeClass>('desktop');

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      setVp(vw < 600 ? 'mobile' : vw <= 1980 ? 'desktop' : 'ultrawide');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return vp;
}
