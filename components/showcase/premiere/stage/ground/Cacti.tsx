'use client';

import React, {memo, useMemo, useEffect, useState} from 'react';
import {computeGroundDepth} from '@/components/showcase/premiere/stage/ground/computeGroundDepth';


import {useArtifactPlacementStore} from '@/states/showcase/premiere/stage_setting/useArtifactPlacementStore';
import {useResizeStore} from '@/states/useResizeProvider';

const STAGE_BUFFER = 11

export interface CactiProps {
    visible?: boolean;
    pointerEvents?: 'auto' | 'none';
    layers?: CactusLayer[];
    centerBlockPct?: number; // optional external override
    edgeGutterPct?: number;
}

export type CactusLayer = {
    imgSet: string[];
    opacity: number;
    heightVh: number;
    bottomVh?: number;
    count: number;
    filter?: string;
};

const cactusImages = [
    '/assets/showcase/premiere/stage_setting/cacti/cactus_1.svg',
    '/assets/showcase/premiere/stage_setting/cacti/cactus_2.svg',
    '/assets/showcase/premiere/stage_setting/cacti/cactus_3.svg',
    '/assets/showcase/premiere/stage_setting/cacti/cactus_4.svg',
    '/assets/showcase/premiere/stage_setting/cacti/cactus_5.svg',
    '/assets/showcase/premiere/stage_setting/cacti/cactus_6.svg',
    '/assets/showcase/premiere/stage_setting/cacti/cactus_7.svg',
];

export const defaultCactusLayers: CactusLayer[] = [
    {
        imgSet: cactusImages,
        opacity: 1,
        heightVh: 3,
        bottomVh: 53,
        count: 6,
        filter: 'grayscale(2%) brightness(0.1) saturate(0.2)',
    },
    {
        imgSet: cactusImages,
        opacity: 1,
        heightVh: 6,
        bottomVh: 47,
        count: 2,
        filter: 'grayscale(50%) brightness(0.2) saturate(0.75)',
    },
    {
        imgSet: cactusImages,
        opacity: 1,
        heightVh: 12,
        bottomVh: 43,
        count: 1,
        filter: 'grayscale(40%) brightness(0.2) saturate(0.80)',
    },
    {
        imgSet: cactusImages,
        opacity: 1,
        heightVh: 24,
        bottomVh: 33,
        count: 2,
        filter: 'grayscale(30%) brightness(0.4) saturate(0.85)',
    },
];

// ===== Helpers =====
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

// ===== Layout builder (with center divider) =====
function buildPlan(
    layers: CactusLayer[],
    centerBlockPct = 60,
    edgeGutterPct = 3
) {
    const posSeed = Math.floor(Math.random() * 100000) || 1;
    const imgSeedEff = Math.floor(Math.random() * 100000) || 2;

    const posRnd = seededRandomFactory(posSeed);

    const halfBlock = centerBlockPct / 2;
    const blockL = 50 - halfBlock;
    const blockR = 50 + halfBlock;
    const leftEdge = edgeGutterPct;
    const rightEdge = 100 - edgeGutterPct;

    return layers.map((layer, bandIdx) => {
        const leftCount = Math.floor(layer.count / 2);
        const rightCount = layer.count - leftCount;

        const positions: number[] = [];

        // LEFT
        if (leftCount > 0) {
            const span = blockL - leftEdge;
            const step = span / leftCount;
            const leftPhase = (Math.sin((posSeed + bandIdx * 13.37) * 1.1) * 0.5 + 0.5) * 0.9 - 0.45;
            for (let i = 0; i < leftCount; i++) {
                const raw = leftEdge + step * (i + 0.5 + leftPhase);
                const minC = leftEdge + step * (i + 0.25);
                const maxC = leftEdge + step * (i + 0.75);
                positions.push(clamp(raw, minC, maxC));
            }
        }

        // RIGHT
        if (rightCount > 0) {
            const span = rightEdge - blockR;
            const step = span / rightCount;
            const rightPhase = (Math.sin((posSeed + bandIdx * 7.77) * 1.3) * 0.5 + 0.5) * 0.9 - 0.45;
            for (let i = 0; i < rightCount; i++) {
                const raw = blockR + step * (i + 0.5 + rightPhase);
                const minC = blockR + step * (i + 0.25);
                const maxC = blockR + step * (i + 0.75);
                positions.push(clamp(raw, minC, maxC));
            }
        }

        // Per-band shuffled images
        const imgPickRnd = seededRandomFactory(imgSeedEff + bandIdx * 1000);
        const imgOrder = seededShuffle(layer.imgSet, imgPickRnd);

        // Horizontal jitter based on slot width
        const totalSpan = Math.max(0, blockL - leftEdge) + Math.max(0, rightEdge - blockR);
        const slotWidth = positions.length > 0 ? totalSpan / positions.length : 0;
        const jitterAmp = slotWidth * 0.28;

        const items = positions.map((pos, i) => {
            const img = imgOrder[i % imgOrder.length];

            // X jitter + light Y/scale variety
            const jitterX = (posRnd() - 0.5) * jitterAmp;
            const leftPct = clamp(pos + jitterX, leftEdge, rightEdge);

            const translateY = (posRnd() * 1.6) - 0.8; // ±0.8%
            const scale = 0.94 + posRnd() * 0.14;      // 0.94–1.08

            return {
                img,
                leftPctStr: toPctStr(leftPct, 4),
                translateYStr: `${translateY.toFixed(2)}%`,
                scaleStr: scale.toFixed(2),
            };
        });

        return {layer, items};
    });
}


function Cacti(
    {
        visible = true,
        pointerEvents = 'none',
        layers = defaultCactusLayers,
        edgeGutterPct = 2,
        centerBlockPct: centerBlockPctOverride, // optional override
    }: CactiProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // pull live stage + viewport values
    const stageRect = useArtifactPlacementStore(s => s.stageRectPx);
    const vw = useResizeStore(s => s.width);

    // derive center gutter from stage width vs viewport (or accept external override)
    const centerBlockPct = useMemo(() => {
        if (typeof centerBlockPctOverride === 'number') return centerBlockPctOverride;

        const stageW = stageRect?.width ?? 0;
        const viewportW = vw ?? 0;
        if (stageW <= 0 || viewportW <= 0) return 66; // safe first paint

        const raw = (stageW / viewportW) * 100;
        const buffer = STAGE_BUFFER;
        const val = raw + buffer;

        return Math.max(20, Math.min(90, val)); // clamp for sanity
    }, [centerBlockPctOverride, stageRect?.width, vw]);

    const plan = useMemo(
        () => buildPlan(layers, centerBlockPct, edgeGutterPct),
        [layers, centerBlockPct, edgeGutterPct]
    );

    if (!visible || !mounted) return null;

    return (
        <div
            className="cacti-root"
            style={{position: 'absolute', left: 0, bottom: 0, width: '100%', pointerEvents, height: 0}}
            aria-hidden="true"
        >
            {plan.map(({layer, items}, bandIdx) => (
                <div
                    key={bandIdx}
                    className="cacti-band"
                    style={{
                        position: 'absolute',
                        left: 0,
                        bottom: `${layer.bottomVh ?? 0}vh`,
                        width: '100%',
                        height: `${layer.heightVh}vh`,
                        opacity: layer.opacity,
                        zIndex: computeGroundDepth(layer.bottomVh ?? 0, 0, 0),
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
                                transform: `translate(-50%, ${item.translateYStr}) scale(${item.scaleStr})`,
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

export default memo(Cacti);
