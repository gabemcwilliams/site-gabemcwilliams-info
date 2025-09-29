// /app/(main)/layout.tsx
import Navbar from "@/components/core/Navbar";
import Footer from "@/components/core/Footer";

import CoreLogoOverlayPortal from "@/components/core/overlay/CoreLogoOverlayPortal";

import React from "react";

export default function MainLayout({children}: { children: React.ReactNode }) {

    console.log('Inside MainLayout');
    return (
        <>


            <div className="flex flex-col min-h-screen relative z-[1]">

                <CoreLogoOverlayPortal/>



                <Navbar/>
                <main className="flex-grow">{children}</main>
                <Footer/>

            </div>
        </>
    );
}
