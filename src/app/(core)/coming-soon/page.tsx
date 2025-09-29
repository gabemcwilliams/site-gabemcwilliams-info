// app/coming-soon/page.tsx
import Link from "next/link";

export default function ComingSoonPage() {
    return (
        <section className="text-page">
            <h1 className="text-3xl md:text-4xl font-bold mb-12">
                Want to see more?
            </h1>

            <p className="text-xl mb-22">
                Here’s what I’m working on now, and where it’s headed next.


            </p>

            <h2 className="text-2xl font-semibold mb-6">Current project</h2>
            <p className="text-xl mb-24">
                A tool that compares resumes and job descriptions, highlighting skills,
                experience, and gaps. It uses clean text processing, semantic
                similarity, and transparent scoring to help people understand where they
                stand and what to improve.
            </p>

            <h2 className="text-2xl font-semibold mb-6">Future projects</h2>
            <p className="text-xl mb-24">
                Looking toward combining nature, machine learning, and robotics in ways
                that feel a little magical but stay grounded in real purpose, edge inference, and life responsive
                automation.
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
                <p className="mb-2">
                    Looking for{" "}
                    <Link
                        href="/story"
                        className="text-[var(--BRAND_ROBOT)] hover:text-[#252525] "
                    >
                        talent
                    </Link>
                    ?
                </p>
                <p>
                    Want to hear more?{" "}
                    <Link
                        href="/contact"
                        className="text-[var(--BRAND_ROBOT)] hover:text-[#252525] "
                    >
                        Let’s talk!
                    </Link>
                </p>
            </blockquote>

            <p className="text-md mb-1 italic">
                Don’t hesitate to try the spotlight game again.
                The cacti and ground cover have a mind of their own, and the moon shifts mood and sometimes position.


            </p>
            <p className="text-md italic">
                How fast can you find it again? Try a different order, or simply enjoy the desert calm.
            </p>

        </section>
    );
}
