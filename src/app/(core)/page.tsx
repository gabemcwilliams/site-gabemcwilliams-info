'use client';

import {useRouter} from 'next/navigation';

import {useSpotlightMaskStore} from '@/states/showcase/premiere/useSpotlightMaskStore';

import React, {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';


export default function Home() {
    // ---------------------------------------------------------
    // Constants
    // ---------------------------------------------------------
    const STRETCH_MULTIPLIER = 5;
    const FINAL_RADIUS = 100;

    // ---------------------------------------------------------
    // Refs
    // ---------------------------------------------------------

    const router = useRouter();

    const dotRef = useRef<SVGSVGElement | null>(null);           // Page SVG (ball)
    const spanRef = useRef<HTMLSpanElement | null>(null);        // Anchor for initial ball position
    const mainRef = useRef<HTMLElement | null>(null);            // Layout container

    const maskSvgRef = useRef<SVGSVGElement | null>(null);       // Global overlay SVG (#global-mask-svg)
    const spotlightRef = useRef<SVGCircleElement | null>(null);  // Global hole circle (#spotlight-tracker)
    const maskRectRef = useRef<SVGRectElement | null>(null);     // Global overlay rect

    const bgCircleRef = useRef<SVGCircleElement | null>(null);   // Gradient circle behind the ball (page SVG)

    const MASK_SHRINK_PX = 2; // shrink mask overlap

    // ---------------------------------------------------------
    // Spotlight defaults
    // ---------------------------------------------------------
    const cxFallback = 1546.2;
    const cyFallback = 1114.928 - 211.578125;
    const rFinal = FINAL_RADIUS;
    const maskColor = '#201e1f';

    const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);


    // ---------------------------------------------------------
    // Main animation effect
    // ---------------------------------------------------------
    function landingAnimationEffect() {
        const timeout = setTimeout(() => {
            const svgEl = dotRef.current;
            const svgElMask = document.querySelector('#global-mask-svg') as SVGSVGElement | null;
            maskSvgRef.current = svgElMask || null;

            if (!svgEl || !svgElMask) {
                console.warn('SVG elements not ready yet');
                return;
            }

            const spanEl = spanRef.current;
            const mainEl = mainRef.current;
            const footerEl = document.querySelector('footer');

            if (!svgEl || !spanEl || !mainEl || !footerEl || !svgElMask) return;

            const width = window.innerWidth;
            const height = window.innerHeight;

            // Page SVG
            const svg = d3.select(svgEl);

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

            stopTop
                .attr('offset', '0%')
                .attr('stop-color', '#623516');

            stopBottom
                .attr('offset', '100%')
                .attr('stop-color', '#623516');


            // Gradient orientation
            groundGrad
                .attr('x1', '0%').attr('y1', '0%')
                .attr('x2', '0%').attr('y2', '100%');

            // Size the page SVG
            const extraPadding = FINAL_RADIUS * 3;
            svg
                .attr('width', window.innerWidth)
                .attr('height', `${mainEl.getBoundingClientRect().height + extraPadding}px`)
                .style('overflow', 'visible');

            // Geometry
            const svgBox = svgEl.getBoundingClientRect();
            const spanBox = spanEl.getBoundingClientRect();
            const footerBox = footerEl.getBoundingClientRect();

            const cxStart = spanBox.left - svgBox.left + spanBox.width / 2;
            const cyStart = spanBox.top - svgBox.top + spanBox.height / 2;
            const radius = spanBox.height * 0.08;

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
            if (defsGlobal.empty()) { // @ts-ignore
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
            setTimeout(() => {
                requestAnimationFrame(() => {
                    ball
                        .transition()
                        .delay(3400)
                        .duration(3000)
                        .ease(d3.easeBounce)
                        .attr('cy', cyEnd)
                        .attrTween('r', function () {
                            const i = d3.interpolate(radius, expandedRadius);
                            return function (t: number): string {
                                return i(t).toString();
                            };
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

                                                    mask.append('rect')
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
                                                        // inside your d3 on('end') on Landing
                                                        .on('end', () => {
                                                            const api = useSpotlightMaskStore.getState();
                                                            api.setSeed({cx: x, cy: adjustedY, r: finalRadius}); // one-shot seed
                                                            api.setEnabled(true);

                                                            queueMicrotask(() => {
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

        return () => clearTimeout(timeout);
    }

    useEffect(landingAnimationEffect, []);

    // ---------------------------------------------------------
    // Spotlight handlers
    // ---------------------------------------------------------
    const hitboxCenterRef = useRef<{ cx: number; cy: number } | null>(null);

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
            d3.select(spotlightRef.current)
                .attr('cx', cxMask)
                .attr('cy', cyMask);
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
    // Render
    // ---------------------------------------------------------
    return (
        <>
            <main
                ref={mainRef}
                style={{zIndex: 500, height: '33vh'}}
                className="
                            flex-grow min-h-0 h-full
                            bg-[var(--background)]
                            text-[var(--TEXT_PRIMARY)]
                            flex justify-start px-[8rem] pt-[6rem]
                            relative
                            "
            >
                <div className="max-w-screen-md relative">
                    <h1 className="text-[4rem] font-bold leading-tight">
                        Experiment
                        {/*
                          Invisible "shim" period:
                          - Inline-block anchor for the ball’s initial geometry.
                          - Colored to match background; not user-visible.
                          - Provides stable measurements via getBoundingClientRect.
                        */}
                        <span
                            ref={spanRef}
                            className="inline-block text-[var(--background)] translate-y-[0.5em] w-[0.5ch] h-[1em] align-baseline"
                            aria-hidden="true"
                        >
                          .
                        </span>
                        <br/>
                        Build.<br/>
                        Predict.
                    </h1>
                </div>

                {/* Page SVG for the ball & local visuals */}
                <svg ref={dotRef} style={{position: 'absolute', top: 0, left: 0, zIndex: 10}}/>

                {/*{ballPosition && (*/}
                {/*    <img*/}
                {/*        src="/assets/showcase/premiere/click_me.svg"*/}
                {/*        alt=""*/}
                {/*        role="presentation"*/}
                {/*        style={{*/}
                {/*            position: 'absolute',*/}
                {/*            left: `${ballPosition.x - 210}px`,*/}
                {/*            top: `${ballPosition.y - 10}px`,*/}
                {/*            width: '100px',*/}
                {/*            transform: 'translateY(-50%)',*/}
                {/*            pointerEvents: 'none',*/}
                {/*        }}*/}
                {/*    />*/}
                {/*)}*/}
            </main>
        </>
    );
}
