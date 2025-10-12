// app/layout.tsx
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";

import Script from "next/script";
import React from "react";
import {SpeedInsights} from "@vercel/speed-insights/next";
import {ResizeManager} from "@/components/ResizeManager";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    preload: false,
});

export const metadata: Metadata = {
    title: "Gabriel McWilliams Info",
    description:
        "Portfolio and demo projects showcasing full-stack AI, frontend UX, and embedded systems.",
    icons: {
        icon: [{url: "/gabe_mcwilliams_logo_base_favicon_circle.svg", type: "image/svg+xml"}],
        apple: "/gabe_mcwilliams_logo_base_favicon_circle.svg",
    },
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        // Keep your attribute; we’ll add our own classes via script
        <html lang="en" data-spotlight-armed="0" suppressHydrationWarning className="no-js">
        <head>
            {/* Preload the splash asset so it paints immediately. Replace the href if needed. */}
            <link
                rel="preload"
                href="/brand/logo_growing.svg"
                as="image"
                type="image/svg+xml"
            />
            <meta name="theme-color" content="#0b0b0c"/>
            <title>Gabriel McWilliams Info</title>
        </head>

        <body className={`${inter.variable} antialiased`}>
        {/* SSR splash: visible by default; hidden once the client marks app-ready.
            Lives above everything so you don’t need to wrap your app. */}
        {/*<div id="first-paint-splash" role="status" aria-live="polite" aria-busy="true">*/}
        {/*    <figure>*/}
        {/*        <img*/}
        {/*            src="/assets/logos/logo_img.svg"   // <-- change if your main mark is elsewhere*/}
        {/*            alt="Gabe McWilliams Logo"*/}
        {/*            style={{*/}
        {/*                width: '10vw',*/}
        {/*                height: 'auto',*/}
        {/*                maxWidth: 'none'*/}
        {/*            }}*/}
        {/*            fetchPriority="high"*/}
        {/*        />*/}

        {/*    </figure>*/}
        {/*</div>*/}

        {/* Your app */}
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                {children}
                <ResizeManager/> {/* your global listener remains */}
                <SpeedInsights/>
            </main>
        </div>

        {/* Gate logic:
            - On client ready, hide splash (html.app-ready)
            - On resize, re-show splash (html.resizing), hide after debounce */}
        {/*<Script id="splash-gate" strategy="afterInteractive">*/}
        {/*    {`*/}
        {/*    (function () {*/}
        {/*      var html = document.documentElement;*/}
        {/*      html.classList.remove('no-js');*/}

        {/*      // Give layout a beat to settle (fonts, first measure) before hiding splash.*/}
        {/*      // Tweak these if you want the splash to hold longer/shorter.*/}
        {/*      var MIN_FRAMES = 2;*/}
        {/*      var frameCount = 0;*/}
        {/*      function afterFrames() {*/}
        {/*        frameCount++;*/}
        {/*        if (frameCount >= MIN_FRAMES) {*/}
        {/*          html.classList.add('app-ready');*/}
        {/*        } else {*/}
        {/*          requestAnimationFrame(afterFrames);*/}
        {/*        }*/}
        {/*      }*/}
        {/*      requestAnimationFrame(afterFrames);*/}

        {/*      // Re-gate on resize*/}
        {/*      var resizing = false;*/}
        {/*      var t = null;*/}
        {/*      var DEBOUNCE_MS = 160; // adjust as needed based on your layout work*/}

        {/*      function onResizeStart() {*/}
        {/*        if (!resizing) {*/}
        {/*          resizing = true;*/}
        {/*          html.classList.add('resizing');*/}
        {/*        }*/}
        {/*        if (t) clearTimeout(t);*/}
        {/*        t = setTimeout(onResizeEnd, DEBOUNCE_MS);*/}
        {/*      }*/}

        {/*      function onResizeEnd() {*/}
        {/*        resizing = false;*/}
        {/*        html.classList.remove('resizing');*/}
        {/*      }*/}

        {/*      window.addEventListener('resize', onResizeStart, { passive: true });*/}

        {/*      // Optional manual hooks for debugging*/}
        {/*      window.__showSplash = function () { html.classList.add('resizing'); };*/}
        {/*      window.__hideSplash = function () { html.classList.remove('resizing'); };*/}
        {/*    })();*/}
        {/*  `}*/}
        {/*</Script>*/}
        </body>
        </html>
    );
}
