export default function FallbackOverlay() {
  // Must match the “overlay ON” state exactly (same ID/z-index/position)
  return (
    <div
      id="spotlight-overlay"                // same id the live Spotlight uses
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        // No transitions on first paint
        transition: 'none',
        // Match your live mask’s first-frame look (not a page bg)
        // If your real mask shows a dark scrim with a circular hole,
        // use the SAME gradient/clip here:
        background:
          'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 18%, rgba(0,0,0,.85) 60%, #000 100%)',
      }}
    />
  );
}
