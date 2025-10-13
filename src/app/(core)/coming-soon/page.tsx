'use client';

import Link from 'next/link';

export default function ComingSoonPage() {
  return (
    <section className="text-page pb-24 md:pb-32">
      <h1 className="text-3xl md:text-4xl font-bold mb-8">
        Want to see more?
      </h1>

      <br />

      <h2 className="text-2xl font-semibold mb-4">Current projects</h2>

      <ul className="text-lg leading-relaxed space-y-8 mb-16 list-disc pl-6">
        <li>
          <span className="font-semibold">AI-driven job search engine:</span>
          an intelligent matcher aligning resumes and job descriptions with transparency and control.
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><span className="font-semibold">Backend:</span> FastAPI + PostgreSQL + Redis</li>
            <li><span className="font-semibold">ML:</span> embeddings for semantic matching and skill clustering</li>
            <li><span className="font-semibold">Frontend:</span> Next.js + D3.js visual insight into alignment and fit</li>
          </ul>
        </li>

        <li>
          <span className="font-semibold">Edge-first plant care system:</span>
          sensors, a lightweight gateway, and a dashboard for monitoring soil conditions and safe, bounded watering.
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><span className="font-semibold">Edge:</span> ESP32 + soil moisture + pump lockouts</li>
            <li><span className="font-semibold">Gateway:</span> MQTT + FastAPI + local metrics</li>
            <li><span className="font-semibold">UI:</span> live status, last water event, one-tap “water”</li>
          </ul>
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mb-4">Future projects</h2>
      <p className="text-xl mb-6">
        Developing expressive, edge-driven robotics that blend LLMs, sensors, and motion for natural interaction.
      </p>
      <ul className="text-lg leading-relaxed space-y-2 mb-16 list-disc pl-6">
        <li>Adaptive voice and motion control</li>
        <li>Local inference for privacy and autonomy</li>
        <li>Personality-driven dialogue models</li>
      </ul>
    </section>
  );
}
