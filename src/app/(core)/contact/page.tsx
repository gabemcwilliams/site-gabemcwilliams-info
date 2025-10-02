// app/contact/page.jsx
// import Link from 'next/link';
import {CalendlyButton, CalendlyInline} from '@/components/core/contact/CalendlyWidget';


export default function ContactPage() {
    return (
        <div
            className="
                flex
                flex-col
                space-x-14
                md:flex-row
                gap-8
                text-page
            "
        >
            {/* Left Column */}
            <section className="md:w-1/2 flex flex-col">
                <h1 className="text-4xl font-bold mb-12">Let’s Talk</h1>

                <p className="text-xl mb-8">
                    I’m an ML-first developer with a strong background in infrastructure, now specializing in
                    building end-to-end machine learning pipelines and moving deeper into edge AI and real-time
                    robotics.
                </p>

                <p className="text-xl mb-12">
                    If you&#39;re looking for someone who can bridge data engineering, model deployment, and edge
                    inference, I’d love to hear from you.
                </p>

                {/* Email link */}
                <p className="text-xl mb-12">
                    You can contact me at <span></span>
                    <a
                        href="mailto:contact@gabemcwilliams.info?subject=Inquiry%20from%20gabemcwilliams.info"
                        className="font-semibold hover:text-[var(--TEXT_PRIMARY)] text-[var(--BRAND_ROBOT)]"
                    >
                        gabe@gabemcwilliams.info
                    </a>
                    <span></span> or use the calendar to schedule a meeting.
                </p>

                <div className="mb-24">
                    <h2 className="text-2xl font-semibold mb-6">I’m open to:</h2>
                    <ul
                        className="
                            list-disc
                            list-inside
                            text-lg
                            mb-8
                            space-y-1
                        "
                    >
                        <li>ML architecture & deployment consulting</li>
                        <li>Tracking: MLflow, Prefect, FastAPI</li>
                        <li>Edge devices & embedded systems</li>
                        <li>Freelance ML & AI contracts</li>
                        <li>Embedded / edge ML roles</li>
                        <li>Full-time applied ML positions</li>
                        <li>Real-world robotics & inference</li>
                    </ul>
                </div>

                {/* Blockquote pinned to bottom */}
                <blockquote
                    className="
                        border-l-4
                        pl-4
                        border-[var(--BRAND_ROBOT)]
                        font-semibold
                        italic
                        text-sm
                        mt-auto
                        mb-0
                    "
                >
                    * Not currently taking unpaid or equity-only work. Open to funded, serious projects.
                </blockquote>
            </section>

            {/* Right Column */}
            <section
                className="
                    md:w-1/2

                    text-[var(--BRAND_LEAF)]
                    py-6
                    px-8
                    rounded-md

                    flex
                    items-center
                    justify-center
                "
            >
                <CalendlyInline/>
            </section>
        </div>
    );
}
