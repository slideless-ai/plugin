# Slim Tabbed — Build Guide

This guide describes how to generate a `slim-tabbed` presentation. The companion `example.html` is the source of truth — when this guide and the example disagree, follow the example.

## Generation Pattern

1. Read `example.html` end-to-end.
2. Gather inputs from the user (see "Inputs" below). Do not invent factual content.
3. Start from the `example.html` skeleton and replace **content only**:
   - keep the `<style>` block intact (unless changing brand colors — see "Theming")
   - keep all JS intact (sidebar nav, theme toggle, hash routing, counters, lightbox)
   - replace the cover, sidebar tab labels, and the panels with the user's content
4. Use only components from the catalog below. Don't invent new components — if you need a new shape, compose existing ones.
5. Wrap every direct child of a `.panel` in `<div class="anim">…</div>` for the staggered fade-in.
6. Test mentally: does each tab fit on a single scrollable panel? Are keyboard shortcuts wired (number of `1`–`N` keys = number of tabs)?
7. Write to disk at the path the user gave (default `./presentation.html`).

## Inputs to Gather

Ask the user for:

| Input | Required | Notes |
|---|---|---|
| `title` | yes | Used in `<title>`, header brand text, and cover. |
| `subtitle` / `tagline` | yes | Hero line on the cover splash. May contain `<em>` for grayed sub-emphasis. |
| `eyebrow` | yes | Small uppercase line on cover (e.g. "Codika × Hexa Sprint — Mars 2026"). |
| `language` | optional | Sets `<html lang>` and date formatting. Default `en`. |
| `default_theme` | optional | `light` or `dark`. Set the initial `<body class>` accordingly. Default `light`. |
| `sections` | yes | Array of 5–9 sections (becomes the sidebar tabs). Each: `{ label_short, label_full, blocks[] }`. |
| `brand_logo_svg` | optional | Inline SVG path. If absent, use the Codika logo from the example. |

For each `section`:

| Field | Notes |
|---|---|
| `label_short` | Becomes `01`, `02`, … in the sidebar (auto-numbered, no input needed). |
| `label_full` | Sidebar tab text. Keep it short (2–4 words). |
| `blocks` | Ordered array of content blocks (see catalog). |

For each `block`, the shape depends on the type. Catalog below lists per-block fields.

## Theming

CSS variables at `:root` define the palette. To rebrand:

- `--white`, `--black`, grayscale `--gray1`–`--gray6` define the dark theme
- `--secondary`, `--card`, `--foreground`, `--muted`, `--border` define the light theme
- Replace `--white` → user's accent only if they want a non-monochrome theme

Default palette is **monochrome grayscale on near-black** for dark theme and **near-white on light gray** for light theme. This is intentional: the style is editorial/austere. If the user wants color accents, add them via the `*--accent` variants (already in CSS).

## Component Catalog

Each entry below: when to use, minimal HTML pattern, any required JS hooks. All catalog HTML must live inside `<div class="anim">…</div>` wrappers when placed directly in a `.panel`.

### `headline`
Big section title.
```html
<h2 class="headline">Main statement.<br>Optional <em>second line</em>.</h2>
```

### `subline`
Supporting paragraph under a headline.
```html
<p class="subline">Body copy, max ~680px wide. Use <span class="em-highlight">emphasis</span> sparingly.</p>
```

### `label`
Eyebrow above a headline.
```html
<div class="label">SECTION LABEL</div>
```

### `founders`
2–3 founder cards in a row (collapses to column on mobile).
```html
<div class="founders">
  <div class="founder-card"><div class="card">
    <div class="founder-avatar">L</div>
    <div class="founder-name">Luca Derumier</div>
    <div class="founder-role">AI × Distribution</div>
    <p class="founder-desc">Short bio.</p>
    <ul class="founder-bullets">
      <li>Bullet point</li>
    </ul>
  </div></div>
</div>
```

### `s2-grid`
3-column grid with optional accent block (the "us" block among "them" blocks).
```html
<div class="s2-grid">
  <div class="s2-block">
    <div class="s2-block__header">
      <div class="s2-icon"><!-- 24×24 SVG --></div>
      <div class="s2-block-title">Title</div>
    </div>
    <div class="s2-block-body">Body text.</div>
  </div>
  <!-- repeat × 2 -->
  <div class="s2-block s2-block--accent">…</div>  <!-- highlighted block -->
</div>
```

### `card-grid`
Generic icon + title + body cards. Use `card-grid--2` or `card-grid--3` for column count.
```html
<div class="card-grid card-grid--3">
  <div class="card">
    <div class="card__icon"><!-- SVG --></div>
    <div class="card__title">Title</div>
    <div class="card__body">Body.</div>
  </div>
</div>
```

### `thesis-box`
Big bold statement, used as a section anchor.
```html
<div class="thesis-box">"Our core thesis stated in one sentence."</div>
```

### `insight-box`
Highlighted prose block, lighter than thesis. `<strong>` inside renders bright.
```html
<div class="insight-box">Body with <strong>emphasized phrase</strong>.</div>
```

### `match-grid`
"What they do ↔ what we add" comparison with bridge icon.
```html
<div class="match-grid">
  <div class="match-col">
    <h3 class="match-col__title">What they do</h3>
    <ul class="match-col__items"><li>Item</li></ul>
  </div>
  <div class="match-bridge">
    <div class="match-bridge__icon"><!-- arrow SVG --></div>
  </div>
  <div class="match-col match-col--hi">
    <h3 class="match-col__title">What we add</h3>
    <ul class="match-col__items"><li>Item</li></ul>
  </div>
</div>
```

### `metrics`
3-column number tiles. Add `data-count` for animated count-up; `data-text` for delayed text reveal. Both animate when the tab opens.
```html
<div class="metrics">
  <div class="metric">
    <div class="metric__val" data-count="12" data-prefix="" data-suffix="">0</div>
    <div class="metric__label">Label</div>
  </div>
  <div class="metric">
    <div class="metric__val" data-count="50000" data-format="comma" data-prefix="$">0</div>
    <div class="metric__label">Revenue</div>
  </div>
  <div class="metric">
    <div class="metric__val" data-text="6 months">…</div>
    <div class="metric__label">Time</div>
  </div>
</div>
```
**Wiring note:** the example only animates counters in tab index 5. To animate counters in any tab, change the JS condition `if (current === 5)` to a generic `panel.querySelector('.metric__val[data-count], .metric__val[data-text]')` check.

### `compound-viz`
5-column visualization: 3 cards separated by 2 bridges (Stage 1 → bridge → Stage 2 → bridge → Stage 3).
```html
<div class="compound-viz">
  <div class="compound-card compound-card--dim">…</div>
  <div class="compound-bridge">
    <div class="compound-bridge__icon"><!-- arrow --></div>
    <div class="compound-bridge__text">UNLOCKS</div>
  </div>
  <div class="compound-card compound-card--dim">…</div>
  <div class="compound-bridge">…</div>
  <div class="compound-card compound-card--hi">…</div>
</div>
```
Inside each card use `compound-card__label`, `compound-card__big`, `compound-card__sub`, `compound-card__detail`, `compound-bar`/`compound-bar__fill`.

### `ba-grid` (before/after)
2-column before/after comparison.
```html
<div class="ba-grid">
  <div class="ba-card ba-card--before">
    <div class="ba-card__title">BEFORE</div>
    <ul class="ba-card__items"><li>…</li></ul>
  </div>
  <div class="ba-card ba-card--after">
    <div class="ba-card__title">AFTER</div>
    <ul class="ba-card__items"><li>…</li></ul>
  </div>
</div>
```

### `arch-layers`
Vertical stacked layer cards. Use `arch-layer--top`, `arch-layer--mid`, `arch-layer--us` for visual hierarchy.
```html
<div class="arch-layers">
  <div class="arch-layer arch-layer--top"><span>Top layer</span><span class="arch-layer__tag">TAG</span></div>
  <div class="arch-layer arch-layer--mid">…</div>
  <div class="arch-layer arch-layer--us">…</div>
</div>
```

### `factory-flow`
5-step linear flow with auto-rendered arrows between steps.
```html
<div class="factory-flow">
  <div class="factory-step">
    <div class="factory-step__num">1</div>
    <div class="factory-step__label">Step name</div>
  </div>
  <!-- repeat × 5 -->
</div>
```

### `quote-box`
Italic quote with source attribution.
```html
<div class="quote-box">
  "Quote text here."
  <div class="quote-box__source">— Source name</div>
</div>
```

### `deliverables-box`
Small framed list (e.g. "What you get this quarter").
```html
<div class="deliverables-box">
  <div class="deliverables-box__title">DELIVERABLES</div>
  <div class="deliverables-box__items">Item 1 · Item 2 · Item 3</div>
</div>
```

### `zoomable-wrap`
Click-to-zoom image (lightbox handler is global).
```html
<div class="zoomable-wrap">
  <img src="https://…/screenshot.png" alt="…">
  <button class="zoomable-btn" onclick="openLightbox(this.previousElementSibling.src)">
    <!-- expand SVG -->
  </button>
</div>
```

### `section-break`
Horizontal divider inside a panel.
```html
<div class="section-break"></div>
```

## JS Behaviors (don't break these)

The `<script>` block at the bottom of `example.html` provides:

- **Tab switching** — clicks on `.tab-btn[data-tab="N"]`, keyboard `1`–`N`, `↑↓←→`
- **Hash routing** — URL hash `#slide=N` initializes the active tab; updates on every switch
- **Theme toggle** — toggles `body.theme-light` and updates `meta[name=theme-color]`
- **Counter animations** — runs on tab activation when the tab contains `.metric__val[data-count]` or `[data-text]` (currently hardcoded to `current === 5`; generalize if you add metrics to other tabs)
- **Cover overlay** — `dismissCover()` on click, `showCover()` from header brand click
- **Image lightbox** — `openLightbox(src)` / `closeLightbox()`, Escape closes

When you add a new tab, you don't need to change JS — the keyboard handler reads up to `'1'..'9'` so it works for up to 9 tabs out of the box. Beyond 9 tabs, extend the keydown handler.

## Pitfalls

- **Forgetting `.anim` wrappers** → content jumps in without the staggered fade
- **More than 9 tabs** → keyboard shortcut handler caps at `'9'`; either reduce tabs or extend the handler
- **Bad SVG sizes** → s2 icons are 24×24, card icons 18×18, founder avatars 52×52 (text initial). Match these.
- **Counter not animating** → check the tab index in the JS conditional, or generalize the trigger
- **Theme toggle missing on mobile** → keep it in the header; do not move it inside a panel
- **Long single-block panels** → if a panel has only one `.anim` block, it still works but feels sparse. Aim for 3–7 anim blocks per tab.
- **Cover never dismissed** → keep the `onclick="dismissCover()"` on the cover overlay
- **Forgetting `meta[name="theme-color"]`** → the toggle JS depends on it; without it the toggle errors silently

## Output Checklist

Before declaring done, confirm:

- [ ] Single `.html` file, no external assets beyond Google Fonts CDN
- [ ] `<title>` matches the user's title
- [ ] Cover splash text matches the user's tagline + eyebrow
- [ ] Sidebar tab count == number of sections, labels match
- [ ] Each panel wraps every block in `<div class="anim">…</div>`
- [ ] Keyboard shortcuts work for all tabs (≤9)
- [ ] Theme toggle present in header, `meta[name=theme-color]` present in `<head>`
- [ ] No fabricated metrics, names, quotes — all gathered from the user
- [ ] If using `metrics` outside tab 5, the counter trigger has been generalized
