// components/RouteTransitionCover.tsx
'use client';

import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';

type Props = {
    /** How long the solid cover stays fully visible before fading (s) */
    visibleTimer?: number;
    /** Fade duration (s) */
    fadeTimer?: number;
    /** Stacking order — keep < 20 if your other overlay relies on that */
    zIndex?: number;
    /** Cover color */
    color?: string;
    /** Keep the node mounted after fade (usually false) */
    keepMounted?: boolean;
};

export default function RouteTransitionCover(
    {
        visibleTimer = 0, // Seconds
        fadeTimer = 1,    // Seconds
        zIndex = 1500,
        color = '#201e1f',
        keepMounted = false,
    }: Props) {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(true); // opacity 1 → 0
    const [render, setRender] = useState(true);   // unmount after fade

    // --- Named effects ---
    function markMountedEffect() {
        setMounted(true);
    }

    useEffect(markMountedEffect, []);

    function visibleCountdownEffect() {
        const id = setTimeout(() => setVisible(false), visibleTimer * 1000);
        return () => clearTimeout(id);
    }

    useEffect(visibleCountdownEffect, [visibleTimer]);

    // --- Named handler ---
    const handleEnd: React.TransitionEventHandler<HTMLDivElement> = () => {
        if (!visible && !keepMounted) setRender(false);
    };

    if (!mounted || !render) return null;

    return createPortal(
        <div
            aria-hidden
            onTransitionEnd={handleEnd}
            style={{
                position: 'fixed',
                inset: 0,
                background: color,
                zIndex,
                opacity: visible ? 1 : 0,
                transition: `opacity ${fadeTimer}s ease`,
                pointerEvents: visible ? 'auto' : 'none',
            }}
        />,
        document.body
    );
}
