'use client';

import React, {memo} from 'react';

export interface GroundProps {
    top?: string;     // where the ground band starts relative to viewport top
    height?: string;  // height of the gradient band
    zIndex?: number;
    from?: string;    // gradient start color
    to?: string;      // gradient end color
}

function Ground(
    {
        top = '40vh',
        height = '60vh',
        zIndex = 0,
        from = 'black',
        to = '#623516',
    }: GroundProps) {
    return (
        <div
            aria-hidden="true"
            id='bg-grd-styled-gradient'
            style={{
                position: 'absolute',
                left: 0,
                width: '100vw',
                top,
                height,
                background: `linear-gradient(to bottom, ${from}, ${to})`,
                zIndex,
                pointerEvents: 'none',
            }}
        />
    );
}

export default memo(Ground);
