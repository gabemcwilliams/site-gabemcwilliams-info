"use client"

import DownloadProfileButton from "@/components/core/about/DownloadProfileButton";

export default function AboutPage() {
    return (
        <section className="text-page">
            {/* Header + button */}
            <div className="
                            mb-12 flex flex-col
                            gap-4 sm:flex-row
                            sm:items-center
                            sm:justify-between
                            relative

                            "
            >
                <h1 className="text-3xl md:text-4xl font-bold">
                    About me
                </h1>

                <div
                    className="
                                absolute
                                right-0 bottom-0
                                -mr-6  translate-y-[-10%]   /* mobile */
                                sm:-mr-12 sm:translate-y-[-20%]  /* tablets */
                                md:-mr-18 md:translate-y-[-30%]  /* desktops */
                                lg:-mr-23 lg:translate-y-[-40%]  /* large screens */
                              "
                >
                    <DownloadProfileButton width={200}/>
                </div>


            </div>

            <p className="text-xl mb-24">
                Over the last several decades, I’ve built scalable systems for automation and infrastructure,
                enforcing policy and architecting platforms designed for control, repeatability, and resilience.
            </p>

            <blockquote
                className="
                          border-l-4
                          pl-4
                          border-[var(--BRAND_ROBOT)]
                          font-semibold
                          italic
                          text-xl
                          mb-18
                        "
            >
                Today, the paradigm is shifting.
            </blockquote>

            <p className="text-xl mb-10">
                With artificial intelligence, automation evolves beyond static logic. It becomes predictive,
                adaptive,
                and increasingly reflective of the dynamic patterns found in nature, a concept known as{" "}
                <span className="font-bold italic text-[var(--BRAND_ROBOT)]">biomimicry</span>.
            </p>

            <p className="text-xl mb-24">
                No longer limited to scripts and interval-based information gathering, intelligence can now take
                form in
                the physical world through embedded models, sensory feedback, and real-time decision-making.
                This work includes building machine learning transformation pipelines, training embedded models for
                vision, text, and multimodal inputs, and deploying inference to edge devices. The goal is to develop
                systems that learn, react, and adapt at the pace of life.
            </p>

            <blockquote
                className="
                          border-l-4
                          pl-4
                          border-[var(--BRAND_ROBOT)]
                          font-semibold
                          italic
                          text-xl
                          mb-18
                        "
            >
                The future of automation is not just digital. It’s sentient.
            </blockquote>

            <p className="text-xl">
                These are systems that tend to daily rhythms with the same diversity and nuance found in nature,
                augmenting capability, enhancing physical environments, and abstracting away the friction of
                everyday
                repetition. This site documents that work.
            </p>
        </section>
    );
}
