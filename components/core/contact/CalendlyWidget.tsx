'use client';

import { useEffect, useState } from 'react';

export const CalendlyButton = () => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;

        script.onload = () => setReady(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const openCalendly = () => {
        if (ready && typeof window !== 'undefined' && (window as any).Calendly) {
            (window as any).Calendly.initPopupWidget({
                url: 'https://calendly.com/gabemcwilliams/lets-talk?hide_gdpr_banner=1&text_color=6290c3&primary_color=b8470b',
            });
        } else {
            console.warn('Calendly widget not ready yet.');
        }
    };

    return (
        <button
            onClick={openCalendly}
            className="px-4 py-2 rounded bg-[var(--BRAND_ROBOT)] text-black font-semibold hover:brightness-110 active:scale-95 transition-transform"
        >
            Let's Talk It Out
        </button>
    );
};

export const CalendlyInline = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return (
        <div
            className="calendly-inline-widget w-full h-full"
            data-url="https://calendly.com/gabemcwilliams/lets-talk?hide_event_type_details=1&hide_gdpr_banner=1&text_color=6290c3&primary_color=b8470b"
        />
    );
};
