'use client';

import React, {useEffect, useRef, useState} from 'react';
import type {JSX} from 'react';
import {useRouter} from 'next/navigation';
import * as d3 from 'd3';
import {useResizeStore} from '@/states/useResizeProvider';
import {useSpotlightMaskStore} from '@/states/showcase/premiere/useSpotlightMaskStore';
import {useWarmPremiereAssets} from "@/hooks/core/landing/useWarmPremiereAssets";


export type BallSeed = { cx: number; cy: number; r: number };

type Props = {

    widthOK: boolean,

    ballVersion: number



    //   /** Inline element in your H1 used to compute starting cx/cy/r */
    dotRef: React.RefObject<SVGSVGElement | null>;

    //   /** Inline element in your H1 used to compute starting cx/cy/r */
    spanRef: React.RefObject<HTMLElement | null>;

    //   /** Main layout container to compute SVG height */
    mainRef: React.RefObject<HTMLElement | null>;
};

export default function LandingBall(
    {
        widthOK,
        ballVersion,

        dotRef,
        spanRef,
        mainRef,

    }: Props): JSX.Element | null {


    // ---------------------------------------------------------
    // Constants
    // ---------------------------------------------------------
    const STRETCH_MULTIPLIER = 5;
    const FINAL_RADIUS = 100;
    const MASK_SHRINK_PX = 2;
    const maskColor = '#201e1f';


    const MIN_BALL_WIDTH = 1024;

    // Fallbacks if we can’t compute from DOM
    const cxFallback = 1546.2;
    const cyFallback = 1114.928 - 211.578125;
    const rFinal = FINAL_RADIUS;

    // ---------------------------------------------------------
    // Refs
    // ---------------------------------------------------------
    const router = useRouter();


    const maskSvgRef = useRef<SVGSVGElement | null>(null);
    const spotlightRef = useRef<SVGCircleElement | null>(null);
    const maskRectRef = useRef<SVGRectElement | null>(null);
    const bgCircleRef = useRef<SVGCircleElement | null>(null);


    const hitboxCenterRef = useRef<{ cx: number; cy: number } | null>(null);
    const hasStartedRef = useRef(false);

    const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
    const [hydrated, setHydrated] = useState(false);

const w = useResizeStore(s => s.width);
const h = useResizeStore(s => s.height);


    function measureBallCenter(): { x: number; y: number } | null {
        const ballEl = document.getElementById('landing-ball-pre-spotlight');
        const svgBox = dotRef.current?.getBoundingClientRect();
        if (!ballEl || !svgBox) return null;
        const b = ballEl.getBoundingClientRect();
        // convert to page-SVG local coords (same space the mask expects)
        return {x: b.left - svgBox.left + b.width / 2, y: b.top - svgBox.top + b.height / 2};
    }

// whenever viewport changes and the ball is currently running/visible, push a new seed
    useEffect(() => {
        if (!widthOK || !hasStartedRef.current) return; // only if the ball run is active
        const t = setTimeout(() => {
            const c = measureBallCenter();
            if (!c) return;
            // if your mask wants navbar-adjusted Y, add it here
            const navH = document.querySelector('nav')?.getBoundingClientRect().height ?? 0;
            useSpotlightMaskStore.getState().setSeed({
                cx: c.x,
                cy: c.y + navH,
                r: FINAL_RADIUS,
            });
        }, 120); // small debounce so we don't thrash during drag-resize
        return () => clearTimeout(t);
    }, [w, h, widthOK, ballVersion]); // also re-seed on ball restart

    useEffect(() => {
        setHydrated(true);
    }, []);


    // ---------------------------------------------------------
    // Assets prefect hook
    // ---------------------------------------------------------
    useWarmPremiereAssets('/api/v1/premiere-manifest') // warms manifest + prefetches /premiere


    // ---------------------------------------------------------
    // Spotlight handlers
    // ---------------------------------------------------------
    const shrink = () => {
        const ball = document.getElementById('landing-ball-pre-spotlight');
        const maskSvg = maskSvgRef.current;
        const pageSvgEl = dotRef.current;

        if (!ball || !maskSvg || !pageSvgEl) {
            console.warn('Missing ball, global mask SVG, or page SVG');
            return;
        }

        const ballBox = ball.getBoundingClientRect();
        const maskBox = maskSvg.getBoundingClientRect();
        const pageBox = pageSvgEl.getBoundingClientRect();

        // Global-mask coordinates for the hole
        const cxMask = ballBox.left - maskBox.left + ballBox.width / 2;
        const cyMask = ballBox.top - maskBox.top + ballBox.height / 2;

        // Page-SVG coordinates for the gradient circle
        const cxPage = ballBox.left - pageBox.left + ballBox.width / 2;
        const cyPage = ballBox.top - pageBox.top + ballBox.height / 2;

        hitboxCenterRef.current = {cx: cxMask, cy: cyMask};

        // Position the global hole
        if (spotlightRef.current) {
            d3.select(spotlightRef.current).attr('cx', cxMask).attr('cy', cyMask);
        }

        // Ensure overlay rect uses the mask
        if (!maskRectRef.current) {
            const rect = d3
                .select(maskSvgRef.current)
                .append('rect')
                .attr('id', 'global-mask-svg-overlay')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', window.innerWidth)
                .attr('height', window.innerHeight)
                .attr('fill', maskColor)
                .attr('mask', 'url(#shrink-mask)')
                .style('pointer-events', 'none');

            maskRectRef.current = rect.node() as SVGRectElement;
        } else {
            d3.select(maskRectRef.current).attr('mask', 'url(#shrink-mask)');
        }

        // Ensure/position gradient circle behind the ball in the page SVG
        const pageSvg = d3.select(pageSvgEl);
        let bgSel = bgCircleRef.current
            ? d3.select(bgCircleRef.current)
            : pageSvg.select<SVGCircleElement>('#ground-behind-ball');

        if (bgSel.empty()) {
            bgSel = pageSvg
                .insert('circle', '#landing-ball-pre-spotlight') // behind the ball
                .attr('id', 'ground-behind-ball')
                .style('fill', 'url(#ground-grad)')
                .style('pointer-events', 'none')
                .style('opacity', 1);

            bgCircleRef.current = bgSel.node() as SVGCircleElement;
        }

        bgSel.attr('cx', cxPage).attr('cy', cyPage).attr('r', rFinal);

        // Animate hole to final size
        if (spotlightRef.current) {
            d3.select(spotlightRef.current)
                .interrupt()
                .transition()
                .duration(500)
                .ease(d3.easeCubicInOut)
                .attr('r', Math.max(0, rFinal - MASK_SHRINK_PX)); // account for overlap
        }
    };

    const unshrink = () => {
        if (!spotlightRef.current || !maskRectRef.current) return;
        const diagonal = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);

        d3.select(spotlightRef.current)
            .interrupt()
            .transition()
            .duration(500)
            .ease(d3.easeCubicInOut)
            .attr('r', diagonal)
            .on('end', () => {
                d3.select(maskRectRef.current!).remove();
                maskRectRef.current = null;

                if (bgCircleRef.current) {
                    d3.select(bgCircleRef.current).remove();
                    bgCircleRef.current = null;
                }
            });
    };


    // ---------------------------------------------------------
    // Main animation effect (returns cleanup)
    // ---------------------------------------------------------
    function landingAnimationEffect() {
        let tOuter: ReturnType<typeof setTimeout> | null = null;
        let tInner: ReturnType<typeof setTimeout> | null = null;

        tOuter = setTimeout(() => {
            const svgEl = dotRef.current;


            const svgElMask = document.querySelector('#global-mask-svg') as SVGSVGElement | null;
            maskSvgRef.current = svgElMask || null;


            const spanEl = spanRef.current;
            const mainEl = mainRef.current;
            const footerEl = document.querySelector('footer');

            if (!svgEl || !spanEl || !mainEl || !footerEl || !svgElMask) return;

            const width = window.innerWidth;
            const height = window.innerHeight;

            // Page SVG
            const svg = d3.select(svgEl);

            // nuke anything from the previous run
            svg.selectAll('*').interrupt();
            svg.selectAll('*').remove();

            // Ensure a <defs> section exists on the page SVG
            let defsLocal = svg.select<SVGDefsElement>('defs');
            if (defsLocal.empty()) defsLocal = svg.append('defs');

            // Create-or-get linearGradient by id
            function ensureLinearGradient(
                parent: d3.Selection<SVGDefsElement, unknown, null, undefined>,
                id: string
            ): d3.Selection<SVGLinearGradientElement, unknown, null, undefined> {
                const found = parent.select<SVGLinearGradientElement>(`#${id}`);
                if (!found.empty()) return found;
                return parent
                    .append('linearGradient')
                    .attr('id', id) as d3.Selection<SVGLinearGradientElement, unknown, null, undefined>;
            }

            const groundGrad = ensureLinearGradient(defsLocal, 'ground-grad');

            // Configure stops (idempotent)
            let stopTop = groundGrad.select<SVGStopElement>('stop[offset="0%"]');
            let stopBottom = groundGrad.select<SVGStopElement>('stop[offset="100%"]');

            if (stopTop.empty()) stopTop = groundGrad.append('stop').attr('offset', '0%');
            if (stopBottom.empty()) stopBottom = groundGrad.append('stop').attr('offset', '100%');

            stopTop.attr('stop-color', '#623516');
            stopBottom.attr('stop-color', '#623516');

            // Gradient orientation
            groundGrad.attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');

            // Size the page SVG
            const extraPadding = FINAL_RADIUS * 3;

            const containerRect = mainEl.getBoundingClientRect();
            svg
                .attr('width', containerRect.width)
                .attr('height', containerRect.height + extraPadding)
                .style('overflow', 'visible');

            // Geometry
            const svgBox = svgEl.getBoundingClientRect();
            const spanBox = spanEl.getBoundingClientRect();
            const footerBox = footerEl.getBoundingClientRect();

            const cxStart = spanBox.left - svgBox.left + spanBox.width / 2;
            const cyStart = spanBox.top - svgBox.top + spanBox.height / 2;
            const radius = spanBox.height * .085;

            const cxEnd = Math.max(cxStart + 200, svgBox.width * 0.9);
            const cyEnd = footerBox.top - svgBox.top - radius * STRETCH_MULTIPLIER;
            const finalRadius = FINAL_RADIUS;

            const radiusDiff = finalRadius - radius;
            const expandedRadius = radius * STRETCH_MULTIPLIER;


            // -----------------------------------------------------
            // Global mask setup
            // -----------------------------------------------------
            const svgMask = d3.select('#global-mask-svg');

            svgMask
                .attr('width', window.innerWidth)
                .attr('height', window.innerHeight)
                .style('position', 'fixed')
                .style('inset', '0')
                .style('pointer-events', 'none')
                .style('z-index', '2147483646');

            // Ensure global defs/mask
            let defsGlobal = svgMask.select('defs');
            if (defsGlobal.empty()) {
                // @ts-ignore
                defsGlobal = svgMask.append('defs');
            }

            let mask = defsGlobal.select<SVGMaskElement>('#shrink-mask');
            if (mask.empty()) {
                mask = defsGlobal.append('mask').attr('id', 'shrink-mask');
                mask
                    .append('rect')
                    .attr('width', window.innerWidth)
                    .attr('height', window.innerHeight)
                    .attr('fill', 'white');
            }

            let spotlightMask = mask.select<SVGCircleElement>('#spotlight-tracker');
            if (spotlightMask.empty()) {
                spotlightMask = mask
                    .append('circle')
                    .attr('id', 'spotlight-tracker')
                    .attr('cx', ballPosition?.x ?? cxFallback)
                    .attr('cy', ballPosition?.y ?? cyFallback)
                    .attr('r', Math.sqrt(width ** 2 + height ** 2))
                    .attr('fill', 'black');
            }
            spotlightRef.current = spotlightMask.node();

            // Ensure the global overlay rect
            if (!maskRectRef.current) {
                const rect = d3
                    .select(maskSvgRef.current)
                    .append('rect')
                    .attr('id', 'global-mask-svg-overlay')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', window.innerWidth)
                    .attr('height', window.innerHeight)
                    .attr('fill', maskColor)
                    .attr('mask', 'url(#shrink-mask)')
                    .style('pointer-events', 'none');

                maskRectRef.current = rect.node() as SVGRectElement;
            } else {
                d3.select(maskRectRef.current)
                    .attr('width', window.innerWidth)
                    .attr('height', window.innerHeight)
                    .attr('mask', 'url(#shrink-mask)');
            }


            // -----------------------------------------------------
            // Ball draw
            // -----------------------------------------------------
            const ball = svg
                .selectAll('circle.__landingBall')
                .data([1])
                .join('circle')
                .classed('__landingBall', true)
                .attr('cx', cxStart)
                .attr('cy', cyStart)
                .attr('r', radius)
                .style('fill', '#000');


            // -----------------------------------------------------
            // Animation
            // -----------------------------------------------------
            tInner = setTimeout(() => {
                requestAnimationFrame(() => {
                    ball
                        .transition()
                        .delay(3400)
                        .duration(3000)
                        .ease(d3.easeBounce)
                        .attr('cy', cyEnd)
                        .attrTween('r', function () {
                            const i = d3.interpolate(radius, expandedRadius);
                            return (t: number) => i(t).toString();
                        })
                        .on('end', function () {
                            d3.select(this)
                                .transition()
                                .delay(400)
                                .duration(3000)
                                .ease(d3.easeSinInOut)
                                .attr('cx', cxEnd)
                                .on('end', function () {
                                    const rollingBall = d3.select(this);
                                    const cyRolling = parseFloat(rollingBall.attr('cy'));
                                    const rRolling = parseFloat(rollingBall.attr('r'));

                                    const finalBall = d3
                                        .select(this)
                                        .attr('id', 'landing-ball-pre-spotlight')
                                        .on('mouseover', shrink)
                                        .on('mouseout', unshrink);

                                    const bottomY = cyRolling + rRolling - 1;

                                    finalBall
                                        .transition()
                                        .duration(500)
                                        .ease(d3.easeElastic)
                                        .attr('cy', bottomY - finalRadius)
                                        .attr('r', finalRadius)
                                        .style('fill', '#B9480B')
                                        .style('stroke', '#B9480B')
                                        .on('end', function () {
                                            let x = cxEnd;
                                            let y = cyEnd - radiusDiff;

                                            const ballEl = (this as SVGCircleElement).getBoundingClientRect();
                                            const svgElBox = dotRef.current?.getBoundingClientRect();

                                            if (svgElBox) {
                                                x = ballEl.left - svgElBox.left + ballEl.width / 2;
                                                y = ballEl.top - svgElBox.top + ballEl.height / 2;
                                            }

                                            setBallPosition({x, y});

                                            // Shadow & background circle
                                            svg
                                                .insert('circle', '#landing-ball-pre-spotlight')
                                                .attr('cx', x)
                                                .attr('cy', y)
                                                .attr('r', finalRadius)
                                                .style('fill', '#201e1f')
                                                .style('opacity', 0.2)
                                                .attr('id', 'shadow-under-ball');

                                            svg
                                                .insert('circle', '#landing-ball-pre-spotlight')
                                                .attr('cx', x)
                                                .attr('cy', y)
                                                .attr('r', finalRadius)
                                                .style('fill', 'url(#ball-gradient)')
                                                .style('opacity', 0.75)
                                                .attr('id', 'background-ball');

                                            // Click → local wipe & redirect
                                            d3.select(this)
                                                .style('cursor', 'pointer')
                                                .on('click', () => {
                                                    d3.select(this).on('mouseover', null).on('mouseout', null);
                                                    shrink();

                                                    const navHeight =
                                                        document.querySelector('nav')?.getBoundingClientRect().height || 0;
                                                    const adjustedY = y + navHeight;

                                                    const defs = svg.append('defs');
                                                    const mask = defs.append('mask').attr('id', 'shrink-ball-mask');

                                                    mask
                                                        .append('rect')
                                                        .attr('width', '100%')
                                                        .attr('height', '100%')
                                                        .attr('fill', 'black');

                                                    const spotlightCircle = mask
                                                        .append('circle')
                                                        .attr('cx', x)
                                                        .attr('cy', y)
                                                        .attr('r', finalRadius)
                                                        .attr('fill', 'white');

                                                    svg
                                                        .append('rect')
                                                        .attr('width', svgBox.width)
                                                        .attr('height', svgBox.height)
                                                        .attr('fill', '#B9480B') // swap to 'url(#ground-grad)' if desired
                                                        .attr('mask', 'url(#shrink-ball-mask)')
                                                        .attr('pointer-events', 'none');

                                                    spotlightCircle
                                                        .transition()
                                                        .duration(1000)
                                                        .ease(d3.easeCubicInOut)
                                                        .attr('r', 0);

                                                    d3.select(this)
                                                        .transition()
                                                        .duration(1000)
                                                        .ease(d3.easeCubicInOut)
                                                        .attr('r', 0)
                                                        .styleTween('fill', () => d3.interpolateRgb('#B9480B', '#623516'))
                                                        .styleTween('stroke', () => d3.interpolateRgb('#B9480B', '#623516'))
                                                        .style('opacity', 0.8)
                                                        .on('end', () => {
                                                            const api = useSpotlightMaskStore.getState();
                                                            api.setSeed({cx: x, cy: adjustedY, r: finalRadius}); // one-shot seed
                                                            api.setEnabled(true);

                                                            queueMicrotask(() => {
                                                                sessionStorage.setItem('premiereFromLanding', '1');
                                                                router.push('/premiere'); // no query params
                                                            });
                                                        });
                                                });
                                        });
                                });
                        });
                });
            }, 30);
        }, 30);


        // Cleanup
        return () => {
            if (tOuter) clearTimeout(tOuter);
            if (tInner) clearTimeout(tInner);

            // stop any in-flight transitions on this page SVG
            if (dotRef.current) d3.select(dotRef.current).selectAll('*').interrupt();

            // remove transient overlay rect & bg circle
            if (maskRectRef.current) {
                d3.select(maskRectRef.current).remove();
                maskRectRef.current = null;
            }

            if (bgCircleRef.current) {
                d3.select(bgCircleRef.current).remove();
                bgCircleRef.current = null;
            }
        };
    }

    // ---------------------------------------------------------
    // Start animation only at ≥ 1024, once
    // ---------------------------------------------------------
    // useEffect(() => {
    //     if (!widthOK || hasStartedRef.current) return;
    //     hasStartedRef.current = true;
    //     const cleanup = landingAnimationEffect();
    //     return cleanup;
    // }, [widthOK, ballVersion]);

    useEffect(() => {
        if (!widthOK) {
            hasStartedRef.current = false;     // gate closed → allow future restart
            return;
        }

        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        const cleanup = landingAnimationEffect();
        return () => {
            cleanup?.();
            hasStartedRef.current = false;     // allow restart on next change
        };
    }, [widthOK, ballVersion]);

    // ---------------------------------------------------------
    // Render
    // ---------------------------------------------------------
    return (
        <>
            {/* Only mount the SVG when eligible (your gate) */}

            <svg ref={dotRef} style={{position: 'absolute', top: 0, left: 0, zIndex: 10}}/>


        </>
    );


}