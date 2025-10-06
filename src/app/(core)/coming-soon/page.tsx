'use client';

import Link from 'next/link';

export default function ComingSoonPage() {
  return (
    <section className="text-page pb-24 md:pb-32">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">
        Want to see more?
      </h1>

      <p className="text-xl mb-16">
        Here’s what I’m building now—and what’s coming next.
      </p>

      <h2 className="text-2xl font-semibold mb-4">Current project</h2>
      <p className="text-xl mb-6">
        An edge-first plant care system: sensors on-device, a lightweight
        gateway, and a simple dashboard that lets you monitor soil conditions
        and trigger safe, bounded watering.
      </p>
      <ul className="text-lg leading-relaxed space-y-2 mb-16 list-disc pl-6">
        <li><span className="font-semibold">Edge:</span> ESP32 + soil moisture, pump control with lockouts</li>
        <li><span className="font-semibold">Gateway:</span> MQTT + FastAPI, local logging/metrics</li>
        <li><span className="font-semibold">UI:</span> live status, last water event, one-tap “water”</li>
        <li><span className="font-semibold">Next:</span> tiny model for “time-to-water” (quantized)</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Future projects</h2>
      <p className="text-xl mb-6">
        Combining nature, machine learning, and robotics—grounded, edge-driven,
        and actually useful.
      </p>
      <ul className="text-lg leading-relaxed space-y-2 mb-16 list-disc pl-6">
        <li>On-device vision for plant health cues (leaf wilt, color drift)</li>
        <li>Multi-sensor environmental control (light, humidity, airflow)</li>
        <li>Self-auditing pipelines with local-first autonomy</li>
      </ul>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/about"
          className="inline-block rounded-xl px-5 py-2 text-base font-semibold bg-[var(--BG_NAVBAR)] text-[var(--BRAND_LEAF)] hover:text-[var(--BRAND_ROBOT)] transition-colors"
        >
          About me
        </Link>
        <Link
          href="/contact"
          className="inline-block rounded-xl px-5 py-2 text-base font-semibold border border-[var(--BRAND_LEAF)] text-[var(--TEXT_PRIMARY)] hover:border-[var(--BRAND_ROBOT)] hover:text-[var(--BRAND_ROBOT)] transition-colors"
        >
          Get in touch
        </Link>
      </div>
    </section>
  );
}
