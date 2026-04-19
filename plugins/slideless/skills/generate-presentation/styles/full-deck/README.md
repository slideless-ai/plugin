# Full Deck — Cinematic pitch deck

Full-screen slides with smooth fade transitions, word-reveal headline animations, a grid overview (press G to see all slides at once), and a hover-scrubber preview at the bottom. Each slide can pick its own theme (`dark` / `black` / `light` / `white`), and the browser's `meta[name=theme-color]` updates with it.

## Pick this style when

- The audience watches slides advance on a screen (investor pitch, conference talk, demo, recording)
- Each "slide" should be **one big idea**, not a multi-block panel
- You want the deck to **look impressive** — animations, polish, theme variation across slides
- You want **swipe + keyboard + click-scrubber** navigation
- 8–20 slides, each ~30 seconds to 2 minutes of speaking time

## Don't pick this style when

- Content is dense and the audience needs to read at their own pace → use `slim-tabbed/`
- The deck has many sub-points per section (this style favors one focal point per slide)
- The user wants a built-in single-page light/dark theme toggle (this style picks theme per slide)

## What you get

- **Full-screen slides** — `position: absolute; inset: 0`, no scrolling per slide
- **Per-slide theme** — `slide--dark` / `slide--black` / `slide--light` / `slide--white`. Browser theme color updates as you advance.
- **Word-reveal animation** for chosen headlines — words fade in sequentially
- **Stagger animation** — direct children with `.anim` class fade up + un-blur in sequence
- **Keyboard nav** — `←` `→` `↑` `↓` `Space`
- **Touch swipe** — left/right swipe to navigate
- **Click navigation** — prev/next buttons, top progress bar
- **Bottom scrubber zone** — hover near the bottom to preview any slide as a thumbnail; click to jump
- **Grid overview** — click the grid icon (or it's wired to a button) to see all slides as thumbnails; click a tile to jump
- **Slider** to resize grid tiles
- **URL state** — `?slide=N` initializes that slide; updates on every nav
- **Counter animations** — `data-count` and `data-text` on `.metric__val` animate when their slide activates (currently triggered for slide index 12 — generalize if needed)
- **Responsive** — slides reflow at ≤768px

## Component library

Available content blocks (full HTML/CSS in `example.html`, build patterns in `how-to-build.md`):

- `headline` (with `--sm` / `--md` size variants) and word-reveal-headlines via JS
- `subline` / `label` / `text-gray` / `text-white-soft`
- `summary-row` — clickable outline rows with `data-goto` to jump to a slide
- `comp-card` — 3-column comparison cards with `WHAT WE BUILD` accent badge
- `s2-grid` 3-column block grid (same as slim-tabbed)
- `card-grid--2` / `--3` / `--4` — generic icon + title + body cards
- `flywheel` — circular/linear flow with arrows
- `factory-flow` — 5-step linear flow (numbered)
- `arch-layers` — vertical stacked layer cards
- `match-grid` — "what they do ↔ what we add" with bridge icon
- `niche-cloud` + `niche-tag` — flexible tag cloud (with `--hi` accent)
- `metrics` — 3-column number tiles with count-up animation
- `thesis-statement` — large boxed statement
- Compounding viz (inline-styled, used in slide 13 as a 1+1 comparison with a bridge)

## Reference

`example.html` in this folder is the production Codika × Hexa Sprint pitch deck (14 slides, EN). Treat it as ground truth: every component above is used at least once. **Read it in full** before generating new slides.

Next: read `how-to-build.md` for the generation pattern and per-component HTML.
