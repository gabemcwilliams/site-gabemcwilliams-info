// states/core/useLogoAnchorStore.ts
'use client';

import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {subscribeWithSelector} from 'zustand/middleware';

export type LogoAnchor = {
    left: number;
    top: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
    ts: number;
};

type LogoAnchorState = {
    /** Live reading from the navbar icon (may be null on pages without navbar) */
    anchor: LogoAnchor | null;
    /** Last non-null anchor we saw (persists across routes/reloads) */
    lastAnchor: LogoAnchor | null;
    setAnchor: (a: LogoAnchor | null) => void;
};

// --- DEBUG HELPERS (dev only) ---
if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    // Dump current state from DevTools: __anchorDump()
    // @ts-expect-error add to window for debugging
    window.__anchorDump = () => useLogoAnchorStore.getState();

    // Optionally, let yourself set a test anchor from DevTools:
    // __setAnchor(94, 20, 152, 152)
    // @ts-expect-error add to window for debugging
    window.__setAnchor = (left: number, top: number, width = 152, height = 152) => {
        useLogoAnchorStore
            .getState()
            .setAnchor({
                left,
                top,
                width,
                height,
                centerX: left + width / 2,
                centerY: top + height / 2,
                ts: performance.now(),
            });
    };

    console.debug('[useLogoAnchorStore] debug helpers attached');
}

export const useLogoAnchorStore = create<LogoAnchorState>()(
    persist(
        subscribeWithSelector((set) => ({
            anchor: null,
            lastAnchor: null,
            setAnchor: (a) =>
                set((prev) => ({
                    anchor: a,
                    // only update lastAnchor when we have a real measurement
                    lastAnchor: a ? a : prev.lastAnchor,
                })),
        })),
        {
            name: 'logo-anchor',                 // localStorage key
            version: 1,
            // only persist the part we need across routes
            partialize: (s) => ({lastAnchor: s.lastAnchor}),
        }
    )
);
