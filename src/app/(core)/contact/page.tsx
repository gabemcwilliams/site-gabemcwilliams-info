// app/contact/page.jsx
"use client";

import {useViewportGate} from "@/states/core/useViewportGate";
import {CalendlyButton, CalendlyInline} from "@/components/core/contact/CalendlyWidget";

export default function ContactPage() {
    const widthOK = useViewportGate(s => s.widthOK);
    const compact = !widthOK;
    const pad = compact ? "px-6 " : "px-16  xl:px-24 2xl:px-32";

    return (
        <div
            className="
                flex
                flex-col md:flex-row
                gap-8 md:gap-14
                text-page
                max-w-8xl mx-auto w-full
                "
        >
            {/* Left Column */}
            <section className={`text-[var(--TEXT_PRIMARY)] w-full pb-5 ${pad}`}>
                <h1 className="text-4xl font-bold mb-12">Let’s Talk</h1>

                <p className="text-xl mb-8">
                    I’m an data-first local ML developer and systems architect who thrives at the intersection of data,
                    automation, and real-world deployment.
                    My background in infrastructure engineering gives me a deep mastery systems understanding, while my
                    focus on machine learning drives me to build systems that
                    learn, adapt, and scale without constant oversight.
                </p>

                <h2 className="text-2xl font-semibold mb-6">
                    Partnerships & Collaboration
                </h2>

                <p className="text-xl mb-12">
                    I’m currently looking to build partnerships with local and remote businesses in the greater Phoenix
                    area that need data transformation,
                    integration, or predictive analytics solutions. Whether it’s modernizing data pipelines, connecting
                    existing systems, or integrating
                    ML-driven insights into day-to-day operations, I’m open to exploring how we can work together.
                </p>

                <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>

                <p className="text-xl mb-12">
                    You can contact me directly at{" "}
                    <a
                        href="mailto:contact@gabemcwilliams.info?subject=Inquiry%20from%20gabemcwilliams.info"
                        className="font-semibold hover:text-[var(--TEXT_PRIMARY)] text-[var(--BRAND_ROBOT)]"
                    >
                        gabe@gabemcwilliams.info
                    </a>{" "}
                    or use the calendar widget to schedule a meeting.
                </p>


                <h2 className="text-2xl font-semibold mb-6">Open To</h2>

                <ul className="list-disc list-inside text-lg mb-8 space-y-1">
                    <li>Freelance or contract ML and data engineering work</li>
                    <li>Full-time applied ML or MLOps roles</li>
                    <li>API architecture and backend service development</li>
                    <li>Front-end collaboration using React + D3 .js</li>
                    <li>Python-based data transformation and automation projects</li>
                </ul>


                <blockquote
                    className="border-l-4 pl-4 border-[var(--BRAND_ROBOT)] font-semibold italic text-sm mt-auto mb-0">
                    * Not currently taking unpaid or equity-only work. Open to funded, serious projects.
                </blockquote>
            </section>

            {/* Right Column */}
            <section
                className="
          md:w-1/2
          text-[var(--BRAND_LEAF)]
          py-6
          pr-8 lg:pr-16
          rounded-md
          flex items-center justify-center
        "
            >
                <CalendlyInline/>
            </section>
        </div>
    );
}
