# Spotlight ↔ StageSetting: Notes, Decisions, and Gotchas

**Project:** Premiere spotlight + stage reveal
**Purpose:** Document the journey (what we tried, what broke, what finally makes sense) so future-you—or any reader—can
see the constraints, the thinking, and the fixes.

---

## 1) Context (what we’re actually trying to do)

We want a “spotlight” that covers the screen with a dark sheet `#252525` and cuts a circular hole, letting the scene
show through. On redirect, we **must not** show the raw StageSetting for even a frame. The hole should first reveal a
believable base (“Primer”), then seamlessly hand off to the real StageSetting once it’s ready.

---

## 2) Desired behavior (non-negotiables)

* No naked StageSetting flash on redirect/hydration.
* Top cover color is **`#252525`** (brand-consistent).
* Spotlight “hole” initially reveals a **Primer** that matches the StageSetting’s base look.
* When StageSetting is actually ready, remove the Primer → the same hole now shows the real scene.
* Interactions (drag-to-reveal, hover hints) don’t disrupt the cover logic.

---

## 3) The model that works (layered handoff)

Think of four layers:

* **L0 — StageSetting** (bottom): the real scene. Loads/hydrates at its own pace.
* **L1 — Primer** (middle): a plain sheet (or gradient) that looks like StageSetting’s base.
* **L2 — Spotlight sheet** (top): a full-viewport rect **filled `#252525`** with an **SVG mask** cutting the circular
  hole.
* **L3 — SSR Cover** *(optional, top-most at first paint only)*: a one-line server cover to guarantee zero flash on the
  **very first** frame; removed once the spotlight exists.

**Z-index cheat sheet:**

* L0 Stage: `z = 0`
* L1 Primer: `z ≈ 1000` *(pointer-events: none)*
* L2 Spotlight (masked rect): `z ≈ 2000`
* L3 SSR Cover: `z ≈ 2147483647` *(temporary)*

---

## 4) Timeline / handoff (why it doesn’t flash)

1. **First paint (SSR):** L3 is visible ⇒ absolutely no flash.
2. **Spotlight built:** Remove L3. The overlay **wrapper is transparent**; L2 (masked rect, `#252525`) is now the only
   darkener. The hole shows **L1 Primer**.
3. **Stage “ready”:** Remove/fade **L1 Primer**. The same hole now shows **L0 Stage**. Because L1 ≈ L0 base, the change
   is visually seamless.

> Key rule: **only one darkener at a time.** Before mask: L3 (or a temporary wrapper bg). After mask: **only** L2 (
> masked rect). The wrapper itself must be **transparent** once the mask exists.

---

## 5) Known failure modes (symptoms → cause → fix)

### A) “Black silhouette / I can’t see the stage through the hole”

* **Symptom:** You see a black/very dark circle area, not the stage.
* **Cause:** The **wrapper div** behind the masked SVG rect is opaque (e.g., `background: #111`). An SVG `mask` only
  clips the element it’s attached to (the rect), **not** its parent. The hole reveals the wrapper’s background, not the
  stage.
* **Fix:** Once the masked rect exists, make the wrapper **transparent**. Let **only the masked rect** supply the
  darkness.

### B) “Stage shows up before the spotlight”

* **Symptom:** The stage flashes “naked” during redirect/hydration.
* **Cause:** StageSetting SSR/paint beats the spotlight’s client init.
* **Fix:** Use L3 **SSR cover** for the very first paint, or delay mounting StageSetting until after the spotlight mask
  has actually painted (paint-driven gating, not blind timeouts).

### C) “Spotlight vanishes / feels wiped”

* **Symptom:** Overlay disappears and reappears (or disappears during redirect).
* **Cause:** Spotlight got **unmounted** (e.g., Suspense fallback from `useSearchParams`, or cleanup fired too early).
* **Fix:** Don’t wrap Spotlight in Suspense that can trigger on redirect. Build the SVG/mask unconditionally and only
  clean up on true unmount.

### D) “onMaskReady fires too early”

* **Symptom:** You lower/remove early covers before the real masked rect is on-screen.
* **Cause:** You call `onMaskReady` right after building defs/mask, **before** the rect is appended/painted.
* **Fix:** Signal ready only **after** the overlay rect with `mask="url(#...)"` exists **and** the browser has painted (
  e.g., after 1–2 `requestAnimationFrame` ticks).

### E) “Overlay fades but the hole dims too”

* **Symptom:** Hints look wrong; the hole dims with the cover.
* **Cause:** Changing **wrapper** opacity instead of the rect’s fill opacity.
* **Fix:** Keep wrapper opacity at 1; adjust the **rect’s `fill-opacity`** for hinting.

### F) “Multiple masks / weird ID conflicts”

* **Symptom:** Inconsistent clipping or nothing clips.
* **Cause:** Duplicate `<svg>`/`<mask id="spotlight-mask">` instances and collisions.
* **Fix:** One instance, consistent IDs, guard init so you don’t append duplicates; cleanup only on true unmount.

---

## 6) Attempt ledger (what we tried & what happened)

> This is the rough history so readers see what bit us.

1. **Build spotlight only when `enabled` is true**

    * *Result:* Mask sometimes never built on redirect ⇒ no cover; stage flashed.
    * *Lesson:* Build the SVG/mask **always**; use `enabled` only for interactions.

2. **Wrap Spotlight in `<Suspense>` (uses `useSearchParams`)**

    * *Result:* On redirect, suspense fallback unmounted Spotlight ⇒ visible “wipe.”
    * *Lesson:* Avoid Suspense here or ensure fallback is a full opaque cover.

3. **Mount StageSetting normally; fade overlay via state**

    * *Result:* Race conditions; sometimes overlay faded before mask painted.
    * *Lesson:* Gating must be paint-driven (not time-only), or use an SSR cover.

4. **Client-only StageSetting (`ssr:false`), mount after “mask ready”**

    * *Result:* Better, but still had a 1-frame gap on slow devices.
    * *Lesson:* Wait for actual **paints** after appending the masked rect.

5. **Double-`rAF` handoff + tiny delay**

    * *Result:* Smooth on most devices; still okay as a fallback strategy.

6. **“Double cover” bug (black silhouette)**

    * *Result:* Hole showed wrapper color, not stage.
    * *Lesson:* Wrapper must be **transparent** post-mask. Only rect provides darkness.

7. **SSR Cover approach (bulletproof first frame)**

    * *Result:* No flash, predictable. Remove cover once masked rect exists & painted.
    * *Lesson:* This eliminates the entire “first paint” race.

8. **Primer layer under the hole**

    * *Result:* Even before StageSetting is ready, the hole shows a believable base; then we remove Primer to reveal the
      real stage seamlessly.
    * *Lesson:* Great UX; keeps aesthetics consistent.

---

## 7) Quick verification checklist (DevTools)

* Toggle the overlay **wrapper background** off. If the stage instantly appears through the hole → you had **double
  coverage**.
* Ensure the masked **rect exists** with `mask="url(#spotlight-mask)"`.
* Confirm the mask uses **white = cover**, **black = hole**.
* Check there’s **only one** mask/rect instance (no ID duplicates).
* If Spotlight flickers on redirect, search for Suspense fallbacks or remounts.

---

## 8) Practical strategies you can mix & match

* **Hard guarantee (first frame):** Add an L3 **SSR cover**; remove it after the masked rect has painted (2× `rAF`).
* **Seamless visuals:** Use L1 **Primer** under the masked rect so early hole views match the eventual stage.
* **No early StageSetting:** Gate StageSetting mount behind a paint-driven “mask is ready” signal (or just keep SSR
  cover until mask exists).
* **Hinting:** Adjust **rect `fill-opacity`**, not wrapper opacity.
* **Z-index discipline:** Keep the masked rect on top of Primer and Stage; wrapper transparent post-mask.

---

## 9) FAQ (short and blunt)

* **“Why does the hole look black?”**
  Because your **wrapper** is opaque. The mask doesn’t clip the parent, only the rect.

* **“Why did it work when I grabbed the spotlight?”**
  You likely changed which layer you were noticing (`#252525` rect vs wrapper black), but the wrapper was still blocking
  the stage.

* **“Can I just wait N ms?”**
  You can. Better is: wait **for paints** (1–2 `rAF`) after appending the masked rect. Add a tiny ms cushion if you
  must.

* **“Do I need Suspense here?”**
  No. It tends to unmount on redirect with `useSearchParams()`. If you keep it, make the fallback a full opaque cover.

---

## 10) Decision summary (what we’re going with)

* Use **L3 SSR cover** for first paint (optional but safest).
* Build spotlight **unconditionally** and signal “ready” only **after** the masked rect exists **and** has painted.
* Keep the overlay **wrapper transparent** once the mask exists; **only** the masked rect provides the darkness (
  `#252525`).
* Use an **L1 Primer** beneath the masked rect; remove it when StageSetting declares “ready.”
* Keep interactions (`enabled`, drag/hover) separate from mask initialization.
