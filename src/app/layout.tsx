// app/layout.tsx
import type {Metadata} from "next";
import {Inter} from "next/font/google";
import "./globals.css";

import {SpeedInsights} from "@vercel/speed-insights/next";

import React from "react";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    preload: false,
});

export const metadata: Metadata = {
    title: "Gabriel McWilliams — ML Engineer",
    description:
        "Portfolio and demo projects showcasing full-stack AI, frontend UX, and embedded systems.",
    icons: {
        icon: [{url: "/gabe_mcwilliams_logo_base_favicon_circle.svg", type: "image/svg+xml"}],
        apple: "/gabe_mcwilliams_logo_base_favicon_circle.svg",
    },
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        // SSR the gate so client & server markup match
        <html lang="en" data-spotlight-armed="0" suppressHydrationWarning>
        <head>
            <link rel="preload" as="image" href="/assets/showcase/premiere/clouds/streams/cloud_stream_far.svg"/>
            <link rel="preload" as="image" href="/assets/showcase/premiere/clouds/streams/cloud_stream_medium.svg"/>
            <link rel="preload" as="image" href="/assets/showcase/premiere/clouds/streams/cloud_stream_near.svg"/>

        </head>
        <body className={`${inter.variable} antialiased`}>
        <div className="flex flex-col min-h-screen">


            <main className="flex-grow">

                {children}
                <SpeedInsights/>
            </main>

        </div>
        </body>
        </html>
    );
}
