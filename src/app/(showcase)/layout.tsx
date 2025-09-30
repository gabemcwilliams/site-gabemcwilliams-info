// app/(showcase)/layout.tsx
import React from "react";
import PremierLogoOverlayPortal from "@/components/showcase/premiere/spotlight/overlay/PremierLogoOverlayPortal";

export default function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <head>
        <link rel="preload" as="image" href="/assets/showcase/premiere/clouds/streams/cloud_stream_far.svg" />
        <link rel="preload" as="image" href="/assets/showcase/premiere/clouds/streams/cloud_stream_medium.svg" />
        <link rel="preload" as="image" href="/assets/showcase/premiere/clouds/streams/cloud_stream_near.svg" />
      </head>

      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <PremierLogoOverlayPortal />
          {children}
        </main>
      </div>
    </>
  );
}
