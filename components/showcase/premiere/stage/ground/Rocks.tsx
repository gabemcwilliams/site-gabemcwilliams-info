'use client';

import React, {memo, useMemo, useEffect, useState} from 'react';
import {computeGroundDepth} from '@/components/showcase/premiere/stage/ground/computeGroundDepth';

// 🔄 new: pull stage + viewport from stores (no breakpoint guessing)
import {useArtifactPlacementStore} from '@/states/showcase/premiere/stage_setting/useArtifactPlacementStore';
import {useResizeStore} from '@/states/useResizeProvider';

const STAGE_BUFFER = 4.1

export interface RocksProps {
    visible?: boolean;
    pointerEvents?: 'auto' | 'none';
    layers?: RockLayer[];
    centerBlockPct?: number;   // optional external override
    edgeGutterPct?: number;
}

export type RockLayer = {
    imgSet: string[];
    opacity: number;
    heightVh: number;
    bottomVh?: number;
    count: number;
    filter?: string;
};

const rockImages = [
    '/assets/showcase/premiere/stage_setting/rocks/rock_2.webp',
    '/assets/showcase/premiere/stage_setting/rocks/rock_3.webp',
    '/assets/showcase/premiere/stage_setting/rocks/rock_5.webp',
];

export const defaultRockLayers: RockLayer[] = [
  {
    imgSet: rockImages,
    opacity: 0.1,
    heightVh: 0.3,
    bottomVh: 50,
    count: 5,
    filter: 'grayscale(50%) brightness(0.36) contrast(0.98)', // darkest, dullest
  },
  {
    imgSet: rockImages,
    opacity: 1,
    heightVh: 0.7,
    bottomVh: 50,
    count: 3,
    filter: 'grayscale(48%) brightness(0.38) contrast(0.99)',
  },
  {
    imgSet: rockImages,
    opacity: 1,
    heightVh: 2,
    bottomVh: 40,
    count: 3,
    filter: 'grayscale(46%) brightness(0.40) contrast(1.00)',
  },
  {
    imgSet: rockImages,
    opacity: 1,
    heightVh: 4,
    bottomVh: 30,
    count: 3,
    filter: 'grayscale(44%) brightness(0.5) contrast(1.01)',
  },
  {
    imgSet: rockImages,
    opacity: 1,
    heightVh: 3,
    bottomVh: 29,
    count: 2,
    filter: 'grayscale(42%) brightness(0.64) contrast(1.02)',
  },
  {
    imgSet: rockImages,
    opacity: 1,
    heightVh: 3,
    bottomVh: 14,
    count: 1,
    filter: 'grayscale(40%) brightness(0.96) contrast(1.03)',
  },
  {
    imgSet: rockImages,
    opacity: 1,
    heightVh: 5,
    bottomVh: 15,
    count: 1,
    filter: 'grayscale(38%) brightness(1) contrast(1.04)', // lightest, most contrast
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
function buildPlan(layers: RockLayer[], centerBlockPct = 60, edgeGutterPct = 3) {
    // Quick seeds per render (okay since you gate on `mounted`)
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

        // LEFT side (phase prevents “too perfect” symmetry)
        if (leftCount > 0) {
            const span = blockL - leftEdge;
            const step = span / leftCount;
            const phase = (Math.sin((posSeed + bandIdx * 11.11) * 1.07) * 0.5 + 0.5) * 0.9 - 0.45;
            for (let i = 0; i < leftCount; i++) {
                const raw = leftEdge + step * (i + 0.5 + phase);
                const minC = leftEdge + step * (i + 0.25);
                const maxC = leftEdge + step * (i + 0.75);
                positions.push(clamp(raw, minC, maxC));
            }
        }

        // RIGHT side
        if (rightCount > 0) {
            const span = rightEdge - blockR;
            const step = span / rightCount;
            const phase = (Math.sin((posSeed + bandIdx * 7.77) * 1.19) * 0.5 + 0.5) * 0.9 - 0.45;
            for (let i = 0; i < rightCount; i++) {
                const raw = blockR + step * (i + 0.5 + phase);
                const minC = blockR + step * (i + 0.25);
                const maxC = blockR + step * (i + 0.75);
                positions.push(clamp(raw, minC, maxC));
            }
        }

        // Shuffle images per band
        const imgPickRnd = seededRandomFactory(imgSeed + bandIdx * 1000);
        const imgOrder = seededShuffle(layer.imgSet, imgPickRnd);

        // Horizontal jitter based on slot width
        const totalSpan = Math.max(0, blockL - leftEdge) + Math.max(0, rightEdge - blockR);
        const slotWidth = positions.length ? totalSpan / positions.length : 0;
        const jitterAmp = slotWidth * 0.25; // rocks: slightly less jitter than cacti

        const items = positions.map((pos, i) => {
            const img = imgOrder[i % imgOrder.length];

            const jitterX = (posRnd() - 0.5) * jitterAmp;
            const leftPct = clamp(pos + jitterX, leftEdge, rightEdge);

            // subtle vertical & scale variation; tiny rotation helps “rocky” feel
            const translateY = (posRnd() * 1.2) - 0.6;       // ±0.6%
            const scale = 0.96 + posRnd() * 0.12;            // 0.96–1.08
            const rotate = (posRnd() - 0.5) * 4;             // ±2 deg

            return {
                img,
                leftPctStr: toPctStr(leftPct, 4),
                translateYStr: `${translateY.toFixed(2)}%`,
                scaleStr: scale.toFixed(2),
                rotateStr: `${rotate.toFixed(2)}deg`,
            };
        });

        return {layer, items};
    });
}

function Rocks({
                   visible = true,
                   pointerEvents = 'none',
                   layers = defaultRockLayers,
                   edgeGutterPct = 2,
                   centerBlockPct: centerBlockPctOverride, // allow caller override if needed
               }: RocksProps) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // 🔎 pull live stage + viewport values
    const stageRect = useArtifactPlacementStore(s => s.stageRectPx);
    const visualZoomOn = useArtifactPlacementStore(s => s.visualZoomOn);
    const vw = useResizeStore(s => s.width);

    // 🧮 derive center gutter from stage width vs viewport (or accept external override)
    const centerBlockPct = useMemo(() => {
        if (typeof centerBlockPctOverride === 'number') {
            return centerBlockPctOverride;
        }
        const stageW = stageRect?.width ?? 0;
        const viewportW = vw ?? 0;
        if (stageW <= 0 || viewportW <= 0) return 66; // safe first-paint fallback

        const raw = (stageW / viewportW) * 100;
        const buffer = STAGE_BUFFER
        const val = raw + buffer;

        return Math.max(20, Math.min(90, val));
    }, [centerBlockPctOverride, stageRect?.width, vw, visualZoomOn]);

    const plan = useMemo(
        () => buildPlan(layers, centerBlockPct, edgeGutterPct),
        [layers, centerBlockPct, edgeGutterPct]
    );

    if (!visible || !mounted) return null;

    return (
        <div
            className="rocks-root"
            style={{position: 'absolute', left: 0, bottom: 0, width: '100%', pointerEvents, height: 0}}
            aria-hidden="true"
        >
            {plan.map(({layer, items}, bandIdx) => (
                <div
                    key={bandIdx}
                    className="rocks-band"
                    style={{
                        position: 'absolute',
                        left: 0,
                        bottom: `${layer.bottomVh ?? 0}vh`,
                        width: '100%',
                        height: `${layer.heightVh}vh`,
                        opacity: layer.opacity,
                        zIndex: computeGroundDepth(layer.bottomVh ?? 0, 0, 200),
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
                                transform: `translate(-50%, ${item.translateYStr}) rotate(${item.rotateStr}) scale(${item.scaleStr})`,
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

export default memo(Rocks);
