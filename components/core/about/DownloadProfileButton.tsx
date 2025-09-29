// components/DownloadProfileButton.tsx
"use client";

const ZIP_URL =
    "https://site-gabemcwilliams-info.sfo3.cdn.digitaloceanspaces.com/resume/2025_gabe_mcwilliams_info_pack_ml_focus.zip";

const ICONS = {
    base: "/assets/core/about/button_base.svg",
    finger: "/assets/core/about/button_finger_down.svg",
    box0: "/assets/core/about/button_box_no_icon.svg",
    box1: "/assets/core/about/button_box_one_icon.svg",
    box2: "/assets/core/about/button_box_both_icon.svg",
} as const;

export default function DownloadProfileButton({width = 200}: { width?: number }) {
    return (
        <a
            href={ZIP_URL}
            download
            className="group relative inline-block
       focus:outline-none focus-visible:ring-0
        focus-visible:shadow-[0_0_0_2px_rgba(0,0,0,0.25)]
 overflow-hidden"
            aria-label="Download resume and skills package"
            title="Download resume and skills package"
            style={{width, height: Math.round(width / 3)}}
        >
            {/* Always-visible base */}
            <img
                src={ICONS.base}
                alt=""
                className="absolute inset-0 w-full h-full object-contain"
            />

            {/* Default finger layer (fades out on hover) */}
            <img
                src={ICONS.finger}
                alt=""
                className="absolute inset-0 w-full h-full object-contain
             transition-opacity duration-0 group-hover:duration-700 group-hover:opacity-0"
            />

            <img
                src={ICONS.box0}
                alt=""
                className="absolute inset-0 w-full h-full object-contain
             opacity-0 duration-0
             group-hover:opacity-100 group-hover:duration-700 group-hover:delay-500"
            />

            <img
                src={ICONS.box1}
                alt=""
                className="absolute inset-0 w-full h-full object-contain
             opacity-0 duration-0
             group-hover:opacity-100 group-hover:duration-700 group-hover:delay-700"
            />

            <img
                src={ICONS.box2}
                alt=""
                className="absolute inset-0 w-full h-full object-contain
             opacity-0 duration-0
             group-hover:opacity-100 group-hover:duration-700 group-hover:delay-1000"
            />

        </a>
    );
}
