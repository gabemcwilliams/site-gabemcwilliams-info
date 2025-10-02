// /app/(main)/layout.tsx
import Navbar from "@/components/core/Navbar";
import Footer from "@/components/core/Footer";

import CoreLogoOverlayPortal from "@/components/core/landing/CoreLogoOverlayPortal";

import React from "react";

export default function MainLayout({children}: { children: React.ReactNode }) {

    console.log('Inside MainLayout');
    return (
        <>


            <div className="flex flex-col min-h-screen relative z-[1]">

                <CoreLogoOverlayPortal
                    anchorInsetPx={{top: 11.4, left: 0}}
                    offsetPx={{x: 0, y: -5}}
                />


                <Navbar/>
                <main className="flex-grow">{children}</main>
                <Footer/>

            </div>
        </>
    );
}
