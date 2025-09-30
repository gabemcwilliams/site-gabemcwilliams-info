haha yeah… future-you will thank you. let’s spin up a super-light **Issues** setup so you can track polish without slowing down.

# Minimal setup (10 min)

**Labels (opinionated):**

* `P0`, `P1`, `P2`
* `bug`, `polish`, `ux`, `perf`, `infra`
* `area:overlay`, `area:nav`, `area:stage`
* `blocked`, `needs-repro`

**Milestones:**

* `Premiere – polish`
* `Next release`

**Project board (optional):** Todo → In Progress → In Review → Done

---

# Issue template (drop in `.github/ISSUE_TEMPLATE/polish.md`)

```md
---
name: Polish / Fix
about: Small UX/UI fix or tweak
labels: ["polish"]
---

### Context
(What part of the app? Link to preview/prod.)

### Expected vs actual
- Expected:
- Actual:

### Repro / where seen
- URL (preview/prod):
- Browser(s) + OS:

### Acceptance criteria
- [ ] …
- [ ] …

### Notes / screenshots
```

(Add another `bug.md` template if you want the classic “Actual/Expected/Repro/Logs”.)

---

# Seed issues from tonight (copy/paste)

* **P1 · area:stage** Replace emblem with color version; align size/position across landing + spotlight
  *AC:* emblem size = `150±10px` on both pages; top offset respects `--nav-h`.
* **P1 · area:overlay** Persist ball handoff via Zustand; prerender cover uses final `{cx,cy,r}`; cross-fade to live mask
  *AC:* zero pop on route; works Chrome+Firefox.
* **P1 · area:nav** Align overlay SVG to navbar (shifted SVG or consistent `cy - navH`)
  *AC:* circle visually “locks” under nav at all widths.
* **P2 · area:overlay** Visibility/focus recovery (tab back → never dead)
  *AC:* interaction always restored on focus/visibilitychange.
* **P2 · area:nav** Remove “click here” affordance (done) & decide on nav entry animation gating (`.after-boot`)
  *AC:* no first-paint jiggle; nav transitions only after 300–600ms.
* **P2 · area:about** Button animation: shorten, respect `prefers-reduced-motion`
* **P2 · area:contact** Calendar colors match theme tokens (light/dark)

---

# PR template (drop in `.github/pull_request_template.md`)

```md
### What
-

### How to test
1. Open Preview: <paste URL>
2. Steps:
3. Expected:

### Screenshots / video

### Risk & rollback
- Risk:
- Rollback: revert PR / promote previous deployment
```

---

# One-liner to create labels (GitHub CLI)

```bash
gh label create P0 --color FF0000; gh label create P1 --color FF7F00; gh label create P2 --color FFD24D; \
gh label create bug --color D73A4A; gh label create polish --color C5DEF5; gh label create ux --color 5319E7; \
gh label create perf --color 0E8A16; gh label create infra --color 0366D6; \
gh label create "area:overlay" --color 1D76DB; gh label create "area:nav" --color 1D76DB; gh label create "area:stage" --color 1D76DB; \
gh label create blocked --color 000000; gh label create needs-repro --color FBCA04
```

---

If you want, I can turn tonight’s notes into actual Issues text you can paste—just say the word.
