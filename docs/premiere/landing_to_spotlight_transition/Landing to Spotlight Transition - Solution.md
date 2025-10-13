
# Premiere Spotlight – Flash & “only appears after mouse move”

## Findings, Root Cause, and Final Fix

### What we were seeing

* On entering `/premiere`, the spotlight overlay sometimes **didn’t show** until the mouse moved (even a tiny amount).
* Occasionally there was a brief **flash of the stage** before the overlay appeared.
* Z-index constraints meant we couldn’t just throw another mega-cover on top (>2000 breaks the home icon overlay).

### Root cause (in plain English)

1. **Event-driven first paint**
   The overlay’s visibility (`overlayVisible`) only meaningfully changed in **mousemove** handlers (our “hint” logic). With no pointer movement, the overlay stayed at its initial value and effectively **looked off** even though the SVG existed.
2. **Two different layers controlling “what you see”**
   We had both a **masked rect** (fill-opacity = `overlayVisible`) *and* a **wrapper** (opacity = `1 - overlayVisible`). If `overlayVisible` starts at `0`, the wrapper is nearly fully opaque but doesn’t necessarily look like the intended spotlight, and the masked layer looks “absent.”
3. **Mount/paint timing**
   The SVG + mask need at least a frame to actually paint. If we flip gates or remove temp covers too early, users catch a frame of the stage.

### The fix that worked (and why)

**Prime the overlay with a tiny positive value**, e.g. `overlayVisible = 0.002`, on mount.

* This forces the masked rect to **paint immediately**, so the spotlight system is “there” without needing mouse input.
* On the **first user input** (mousemove/touch/keydown), the existing hint logic nudges the value as intended (or you clamp it), and the experience feels instant.
* In practice, `0.002` is visually imperceptible (no obvious dim), but it guarantees the pipeline is **initialized**.

> TL;DR: Don’t start at `0`. Start at a near-zero **epsilon** so the overlay **renders at time-0**, then let input tighten it.

### Minimal behavior spec (so we can recreate it later)

* **Initial state:** `overlayVisible = 0.002` (epsilon).
* **Wrapper & mask:** Keep the wrapper present until the mask is built; once mask is ready, wrapper can be transparent but still there to own stacking.
* **First input:** Any of `pointermove | pointerdown | touchstart | keydown` counts as “user present.” From then on, let the hint logic update `overlayVisible` (and clamp to something like `≤ 0.005`).
* **Finish state:** When all POIs are revealed, freeze input for the next mouseup and fade the overlay out as before.

### Why removing `Audience` killed the overlay (the side mystery)

* `Audience` publishes its box to the **Zustand layout store**. When you removed it, your POI list could end up **empty** or with missing measurements; some effects bail early when there are **no points**. That didn’t directly “hide” the overlay rect, but it short-circuited the logic that made it obvious/interactive.
* Takeaway: **Don’t tie “overlay exists” to “POIs exist.”** Overlay must render regardless; POIs only enhance it.

### Testing checklist

* **No-input test:** Load the page, **don’t move the mouse**. Overlay should still be present (thanks to epsilon).
* **Input test:** Nudge the mouse/touch or press any key. The overlay should react right away.
* **Resize:** Resizing should rebuild geometry **without** dropping the epsilon or requiring new input.
* **Route back/forward:** Optional—store a “primed” flag in `sessionStorage` to skip the epsilon step for same-session re-entries.

### Notes on z-index and color

* Keep the overlay container **below** the home icon overlay (you said >2000 breaks it).
* Perception: `#252525` over dark stage assets can read “blacker” than expected; that’s just blending. If it *looks* too dark, try `#2a2a2a` or reduce the rect’s `fill-opacity` slightly.

---

## One-liner takeaway

> **Prime the overlay with a microscopic non-zero value so it paints immediately, then let the first user input take over.** That removes the “overlay only appears after mouse move” bug *and* kills the initial flash without heavy timers or giant covers.
