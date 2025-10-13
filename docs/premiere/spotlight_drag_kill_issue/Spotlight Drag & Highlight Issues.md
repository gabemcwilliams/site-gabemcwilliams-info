# Spotlight Drag & Highlight Issues

## 1. Spotlight Interactivity Persists After Completion

**Issue:**  
After all points of interest (POIs) were revealed, the spotlight mask remained draggable. The circle (
`#spotlight-tracker`) could still be moved even though the overlay was visually gone.

**Cause:**  
The spotlight’s SVG elements (`drag-target`, `spotlight-tracker`, `spotlight-mask`) were never explicitly removed after
completion. Mouse listeners were still active, so drag events fired on "dead" nodes.

**Solution:**  
A `killSpotlight` helper was added. It:

- Removes spotlight-specific SVG nodes.
- Clears the `mask` attribute from the overlay rect.
- Disables pointer events/cursor styles on the SVG and wrapper.
- Sets a `nukedRef` flag to ensure cleanup only happens once.

This is invoked when all POIs are visible (via the `items` store watcher).

```ts
function killSpotlight(svgEl: SVGSVGElement | null) {
    if (!svgEl) return;
    const svgSel = d3.select(svgEl);

    svgSel.selectAll("#drag-target").remove();
    svgSel.selectAll("#spotlight-tracker").remove();
    svgSel.selectAll("#spotlight-mask").remove();
    svgSel.selectAll("rect[mask]").attr("mask", null);

    svgEl.style.pointerEvents = "none";
    svgEl.style.cursor = "auto";

    const wrap = svgEl.parentElement as HTMLElement | null;
    if (wrap) {
        wrap.style.pointerEvents = "none";
        wrap.style.cursor = "auto";
    }

    console.log("[Kill] Spotlight nuked");
}
````

Triggered in a hook:

```ts
useEffect(() => {
    if (!enabled || nukedRef.current) return;
    const allVisible = Object.values(items).every(i => i.visible);
    if (allVisible) {
        killSpotlight(svgRef.current);
        nukedRef.current = true;
        useMaskVisibilityStore.getState().setEnabled(false);
    }
}, [enabled, items]);
```

---

## 2. Blue Drag Highlight Appears on Stage

**Issue:**
While dragging inside the stage, the browser’s default drag-to-select highlight (blue overlay) appeared, breaking
immersion.

**Cause:**
By default, browsers allow text/image selection when dragging, unless explicitly disabled.

**Solution:**
A scoped drag-disable listener was added. While the mouse is down, `user-select: none` is applied to the `body`. It’s
cleared again on mouseup, so normal selection elsewhere works.

```ts
useEffect(() => {
    const disableSelect = () => document.body.style.userSelect = "none";
    const enableSelect = () => document.body.style.userSelect = "";

    window.addEventListener("mousedown", disableSelect);
    window.addEventListener("mouseup", enableSelect);

    return () => {
        window.removeEventListener("mousedown", disableSelect);
        window.removeEventListener("mouseup", enableSelect);
    };
}, []);
```

This removes the unwanted blue highlight *only during active drags* without permanently disabling text selection across
the site.

---

## ✅ Outcome

* Spotlight now cleans itself up properly once the puzzle is solved.
* Dragging no longer triggers the browser’s blue highlight.
* Interactivity is scoped, reversible, and only active when needed.

