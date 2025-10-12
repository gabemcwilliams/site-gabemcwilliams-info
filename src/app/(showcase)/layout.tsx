// app/(showcase)/layout.tsx
import React from "react";
import PremiereSpotlightSearchMask from "@/components/showcase/premiere/spotlight/overlay/PremiereSpotlightSearchMask";
import Script from "next/script";

export default function ShowcaseLayout({children}: { children: React.ReactNode }) {
    return (
        <>
        {/* SSR splash: visible by default; hidden once the client marks app-ready.
            Lives above everything so you don’t need to wrap your app. */}
        <div id="first-paint-splash" role="status" aria-live="polite" aria-busy="true">
            <figure>
                <img
                    src="/assets/logos/logo_img.svg"   // <-- change if your main mark is elsewhere
                    alt="Gabe McWilliams Logo"
                    style={{
                        width: '10vw',
                        height: 'auto',
                        maxWidth: 'none'
                    }}
                    fetchPriority="high"
                />

            </figure>
        </div>


            <div className="flex flex-col min-h-screen">
                <main className="flex-grow">
                    <PremiereSpotlightSearchMask
                        anchorInsetPx={{top: 0, left: 0}}
                        offsetPx={{x: 0, y: 1}}
                        // debug
                    />
                    {children}
                </main>

                        {/* Gate logic:
            - On client ready, hide splash (html.app-ready)
            - On resize, re-show splash (html.resizing), hide after debounce */}
        <Script id="splash-gate" strategy="afterInteractive">
            {`
            (function () {
              var html = document.documentElement;
              html.classList.remove('no-js');

              // Give layout a beat to settle (fonts, first measure) before hiding splash.
              // Tweak these if you want the splash to hold longer/shorter.
              var MIN_FRAMES = 2;
              var frameCount = 0;
              function afterFrames() {
                frameCount++;
                if (frameCount >= MIN_FRAMES) {
                  html.classList.add('app-ready');
                } else {
                  requestAnimationFrame(afterFrames);
                }
              }
              requestAnimationFrame(afterFrames);

              // Re-gate on resize
              var resizing = false;
              var t = null;
              var DEBOUNCE_MS = 160; // adjust as needed based on your layout work

              function onResizeStart() {
                if (!resizing) {
                  resizing = true;
                  html.classList.add('resizing');
                }
                if (t) clearTimeout(t);
                t = setTimeout(onResizeEnd, DEBOUNCE_MS);
              }

              function onResizeEnd() {
                resizing = false;
                html.classList.remove('resizing');
              }

              window.addEventListener('resize', onResizeStart, { passive: true });

              // Optional manual hooks for debugging
              window.__showSplash = function () { html.classList.add('resizing'); };
              window.__hideSplash = function () { html.classList.remove('resizing'); };
            })();
          `}
        </Script>
            </div>
        </>
    );
}
