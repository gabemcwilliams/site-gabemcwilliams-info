// components/DownloadProfileButton.tsx
"use client";

const ZIP_URL =
    "https://site-gabemcwilliams-info.sfo3.cdn.digitaloceanspaces.com/resume/2025_gabe_mcwilliams_info_pack_ml_focus.zip";

const ICONS = {
    base: "/assets/core/about/button_base.svg",
    finger: "/assets/core/about/button_finger_down.svg",
    box0: "/assets/core/about/button_box_open_base_icon.svg",
    box1: "/assets/core/about/button_box_one_icon.svg",
    box2: "/assets/core/about/button_box_both_icon.svg",
    box3: "/assets/core/about/button_box_closed_icon.svg",
} as const;

export default function DownloadProfileButton({width = 200}: { width?: number }) {
    return (
<a
  href={ZIP_URL}
  download
  className="group relative inline-block overflow-hidden focus:outline-none"
  aria-label="Download resume and skills package"

  style={{ width, height: Math.round(width / 3) }}
>
  {/* Base */}
  <img
    src={ICONS.base}
    alt=""
    className="absolute inset-0 w-full h-full object-contain"
  />

  {/* Finger — instant hide on hover */}
  <img
    src={ICONS.finger}
    alt=""
    className="absolute inset-0 w-full h-full object-contain
               transition-none group-hover:opacity-0"
  />

  {/* Box 0 — instant show on hover */}
  <img
    src={ICONS.box0}
    alt=""
    className="absolute inset-0 w-full h-full object-contain
               opacity-0 transition-none
               group-hover:opacity-100"
  />

  {/* Box 1 — quick fade with pause */}
  <img
    src={ICONS.box1}
    alt=""
    className="absolute inset-0 w-full h-full object-contain
               opacity-0 transition-opacity duration-300
               group-hover:opacity-100 group-hover:delay-[800ms]"
  />

  {/* Box 2 — quick fade with longer pause */}
  <img
    src={ICONS.box2}
    alt=""
    className="absolute inset-0 w-full h-full object-contain
               opacity-0 transition-opacity duration-300
               group-hover:opacity-100 group-hover:delay-[1600ms]"
  />

  {/* Box 3 — quick fade with longest pause */}
  <img
    src={ICONS.box3}
    alt=""
    className="absolute inset-0 w-full h-full object-contain
               opacity-0 transition-opacity duration-300
               group-hover:opacity-100 group-hover:delay-[2400ms]"
  />
</a>


    );
}
