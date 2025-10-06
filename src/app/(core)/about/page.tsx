"use client";

import { useViewportGate } from "@/states/core/useViewportGate";
import DownloadProfileButton from "@/components/core/about/DownloadProfileButton";

export default function AboutPage() {
  // compact when under the same threshold used elsewhere (<= 1024)
  const widthOK = useViewportGate((s) => s.widthOK);
  const compact = !widthOK;

  // spacing + type scales
  const pad = compact ? "4px-6 pt-10" : "px-16 pt-24 xl:px-24 2xl:px-32";
  const h1Cls = compact ? "text-3xl font-bold" : "text-4xl md:text-5xl font-bold";
  const pCls = compact ? "text-lg leading-relaxed" : "text-xl leading-relaxed";
  const quoteCls = compact ? "text-lg" : "text-xl";

  return (
<section
  className="
    text-[var(--TEXT_PRIMARY)]
    w-full
    px-6           /* base gutter (phones/tablets) */
    pb-5
    pt-10
    lg:pl-16 lg:pr-8 lg:pt-24  /* align with nav at ≥1024px */
  "
>
      {/* Header + button */}
      <div className="mb-8 md:mb-12 relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={h1Cls}>About me</h1>

          {compact ? (
            // Compact: keep it in flow on the right; smaller width
            <div className="self-end sm:self-auto">
              <DownloadProfileButton width={160} />
            </div>
          ) : (
            // Desktop: preserve your absolute placement
            <div
              className="
                absolute right-0 bottom-0
                -mr-6 translate-y-[-10%]
                sm:-mr-12 sm:translate-y-[-20%]
                md:-mr-18 md:translate-y-[-30%]
                lg:-mr-23 lg:translate-y-[-40%]
              "
            >
              <DownloadProfileButton width={200} />
            </div>
          )}
        </div>
      </div>

      <p className={`${pCls} mb-10 md:mb-24`}>
        Over the last several decades, I’ve built scalable systems for automation and infrastructure,
        enforcing policy and architecting platforms designed for control, repeatability, and resilience.
      </p>

      <blockquote
        className={`border-l-4 pl-4 border-[var(--BRAND_ROBOT)] font-semibold italic ${quoteCls} mb-10 md:mb-18`}
      >
        Today, the paradigm is shifting.
      </blockquote>

      <p className={`${pCls} mb-8 md:mb-10`}>
        With artificial intelligence, automation evolves beyond static logic. It becomes predictive, adaptive,
        and increasingly reflective of the dynamic patterns found in nature, a concept known as{" "}
        <span className="font-bold italic text-[var(--BRAND_ROBOT)]">biomimicry</span>.
      </p>

      <p className={`${pCls} mb-10 md:mb-24`}>
        No longer limited to scripts and interval-based information gathering, intelligence can now take form in
        the physical world through embedded models, sensory feedback, and real-time decision-making. This work
        includes building machine learning transformation pipelines, training embedded models for vision, text,
        and multimodal inputs, and deploying inference to edge devices. The goal is to develop systems that learn,
        react, and adapt at the pace of life.
      </p>

      <blockquote
        className={`border-l-4 pl-4 border-[var(--BRAND_ROBOT)] font-semibold italic ${quoteCls} mb-10 md:mb-18`}
      >
        The future of automation is not just digital. It’s sentient.
      </blockquote>

      <p className={pCls}>
        These are systems that tend to daily rhythms with the same diversity and nuance found in nature,
        augmenting capability, enhancing physical environments, and abstracting away the friction of everyday
        repetition. This site documents that work.
      </p>
    </section>
  );
}
