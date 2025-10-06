'use client';

import React, {memo, useMemo, useEffect, useState} from 'react';
import {computeGroundDepth} from '@/components/utils/computeGroundDepth';
import {useStageGroundSizeClass} from '@/hooks/showcase/premiere/stage/useStageGroundSizeClass';

export interface GrassProps {
    visible?: boolean;
    pointerEvents?: 'auto' | 'none';
    layers?: GrassLayer[];
    edgeGutterPct?: number;
}

export type GrassLayer = {
    imgSet: string[];
    opacity: number;
    heightVh: number;
    bottomVh?: number;
    count: number;
    filter?: string;
};

const grassImages = [
    '/assets/showcase/premiere/stage_setting/grass/grass_1.webp',
    '/assets/showcase/premiere/stage_setting/grass/grass_2.webp',
    '/assets/showcase/premiere/stage_setting/grass/grass_3.webp',
    '/assets/showcase/premiere/stage_setting/grass/grass_4.webp',
];

export const defaultGrassLayers: GrassLayer[] = [
    {
        imgSet: grassImages,
        opacity: 0.2,
        heightVh: .5,
        bottomVh: 55,
        count: 5,
        filter: 'grayscale(45%) brightness(0.45) contrast(1.05)'
    },
    {
        imgSet: grassImages,
        opacity: 0.3,
        heightVh: 2,
        bottomVh: 45,
        count: 15,
        filter: 'grayscale(45%) brightness(0.55) contrast(1.05)'
    },
    {
        imgSet: grassImages,
        opacity: 0.4,
        heightVh: 4,
        bottomVh: 35,
        count: 6,
        filter: 'grayscale(40%) brightness(0.65) contrast(1.08)'
    },
    {
        imgSet: grassImages,
        opacity: 0.5,
        heightVh: 7,
        bottomVh: 25,
        count: 5,
        filter: 'grayscale(35%) brightness(0.75) contrast(1.1)'
    },
];

// Helpers
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const toPctStr = (n: number, d = 4) => `${n.toFixed(d)}%`;

function seededRandomFactory(initialSeed: number) {
    let seed = initialSeed || 1;
    return () => {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    };
}

function seededShuffle<T>(arr: T[], rnd: () => number): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Layout builder (with divider)
function buildPlan(layers: GrassLayer[], centerBlockPct = 67, edgeGutterPct = 2) {
    // Per-render seeds (OK since you gate render on `mounted`)
    const posSeed = Math.floor(Math.random() * 100000) || 1;
    const imgSeed = Math.floor(Math.random() * 100000) || 2;

    const posRnd = seededRandomFactory(posSeed);

    return layers.map((layer, bandIdx) => {
        const halfBlock = centerBlockPct / 2;
        const blockL = 50 - halfBlock;
        const blockR = 50 + halfBlock;
        const leftEdge = edgeGutterPct;
        const rightEdge = 100 - edgeGutterPct;

        const leftCount = Math.floor(layer.count / 2);
        const rightCount = layer.count - leftCount;

        const positions: number[] = [];

        // LEFT (slight phase per band so it isn’t perfectly symmetric)
        if (leftCount > 0) {
            const span = blockL - leftEdge;
            const step = span / leftCount;
            const phase = (Math.sin((posSeed + bandIdx * 9.19) * 1.05) * 0.5 + 0.5) * 0.9 - 0.45;
            for (let i = 0; i < leftCount; i++) {
                const raw = leftEdge + step * (i + 0.5 + phase);
                const minC = leftEdge + step * (i + 0.25);
                const maxC = leftEdge + step * (i + 0.75);
                positions.push(clamp(raw, minC, maxC));
            }
        }

        // RIGHT
        if (rightCount > 0) {
            const span = rightEdge - blockR;
            const step = span / rightCount;
            const phase = (Math.sin((posSeed + bandIdx * 6.47) * 1.17) * 0.5 + 0.5) * 0.9 - 0.45;
            for (let i = 0; i < rightCount; i++) {
                const raw = blockR + step * (i + 0.5 + phase);
                const minC = blockR + step * (i + 0.25);
                const maxC = blockR + step * (i + 0.75);
                positions.push(clamp(raw, minC, maxC));
            }
        }

        // Per-band shuffled images (so tufts aren’t repeating in lockstep)
        const imgPickRnd = seededRandomFactory(imgSeed + bandIdx * 1000);
        const imgOrder = seededShuffle(layer.imgSet, imgPickRnd);

        // Horizontal jitter sized by slot width (grass = slightly more than rocks)
        const totalSpan = Math.max(0, blockL - leftEdge) + Math.max(0, rightEdge - blockR);
        const slotWidth = positions.length ? totalSpan / positions.length : 0;
        const jitterAmp = slotWidth * 0.30;

        const items = positions.map((pos, i) => {
            const img = imgOrder[i % imgOrder.length];

            // X jitter (spread), Y/scale/rotate for natural “tuft” variance
            const jitterX = (posRnd() - 0.5) * jitterAmp;
            const leftPct = clamp(pos + jitterX, leftEdge, rightEdge);

            const translateY = (posRnd() * 1.8) - 0.9;   // ±0.9%
            const scaleX = 0.92 + posRnd() * 0.18;      // 0.92–1.10 (width variance)
            const scaleY = 0.95 + posRnd() * 0.10;      // 0.95–1.05 (height variance)
            const rotate = (posRnd() - 0.5) * 5;       // ±2.5°

            return {
                img,
                leftPctStr: toPctStr(leftPct, 4),
                translateYStr: `${translateY.toFixed(2)}%`,
                scaleXStr: scaleX.toFixed(2),
                scaleYStr: scaleY.toFixed(2),
                rotateStr: `${rotate.toFixed(2)}deg`,
            };
        });

        return {layer, items};
    });
}


function Grass(
    {
        visible = true,
        pointerEvents = 'none',
        layers = defaultGrassLayers,
        edgeGutterPct = 2,
    }: GrassProps) {
    const [mounted, setMounted] = useState(false);

    // Named effect for mount flag
    function markMountedEffect() {
        setMounted(true);
    }

    useEffect(markMountedEffect, []);

    const vp = useStageGroundSizeClass();

    // Responsive gutter
    const centerBlockPct =
        vp === 'mobile' ? 80 :       // wide gap on mobile
            vp === 'desktop' ? 66 :      // balanced gap on desktop
                33;                          // tighter on ultrawide

    const plan = useMemo(
        () => buildPlan(layers, centerBlockPct, edgeGutterPct),
        [layers, centerBlockPct, edgeGutterPct]
    );

    if (!visible || !mounted) return null;

    return (
        <div
            className="grass-root"
            style={{position: 'absolute', left: 0, bottom: 0, width: '100%', pointerEvents, height: 0}}
            aria-hidden="true"
        >
            {plan.map(({layer, items}, bandIdx) => (
                <div
                    key={bandIdx}
                    className="grass-band"
                    style={{
                        position: 'absolute',
                        left: 0,
                        bottom: `${layer.bottomVh ?? 0}vh`,
                        width: '100%',
                        height: `${layer.heightVh}vh`,
                        opacity: layer.opacity,
                        zIndex: computeGroundDepth(layer.bottomVh ?? 0, 0, 100),
                        filter: layer.filter,
                        overflow: 'visible',
                    }}
                >
                    {items.map((item, i) => (
                        <img
                            key={i}
                            src={item.img}
                            alt=""
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                left: item.leftPctStr,
                                transform: `translate(-50%, ${item.translateYStr}) rotate(${item.rotateStr}) scale(${item.scaleXStr}, ${item.scaleYStr})`,
                                height: '100%',
                                width: 'auto',
                                objectFit: 'contain',
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default memo(Grass);
