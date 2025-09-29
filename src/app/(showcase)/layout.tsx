// /app/(showcase)/layout.tsx

import PremierLogoOverlayPortal from "@/components/showcase/premiere/spotlight/overlay/PremierLogoOverlayPortal";

export default function ShowcaseLayout({children}: { children: React.ReactNode }) {
    return (
        <div className="flex flex-col min-h-screen">

            <main className="flex-grow">

                <PremierLogoOverlayPortal/>

                {children}
            </main>

        </div>


    );
}
