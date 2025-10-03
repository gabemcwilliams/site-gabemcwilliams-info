// app/(showcase)/layout.tsx
import React from "react";
import PremiereSpotlightSearchMask from "@/components/showcase/premiere/spotlight/overlay/PremiereSpotlightSearchMask";

export default function ShowcaseLayout({children}: { children: React.ReactNode }) {
    return (
        <>


            <div className="flex flex-col min-h-screen">
                <main className="flex-grow">
                    <PremiereSpotlightSearchMask
                        anchorInsetPx={{top: 0, left: 0}}
                        offsetPx={{x: 0, y: 3}}
                        // debug
                    />
                    {children}
                </main>
            </div>
        </>
    );
}
