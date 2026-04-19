# Full Deck — Build Guide

This guide describes how to generate a `full-deck` presentation. The companion `example.html` is the source of truth — when this guide and the example disagree, follow the example.

## Generation Pattern

1. Read `example.html` end-to-end.
2. Gather inputs from the user (see "Inputs" below). Do not invent factual content.
3. Start from the `example.html` skeleton and replace **content only**:
   - keep the `<style>` block intact (unless changing brand colors — see "Theming")
   - keep all JS intact (navigation, word-reveal, counter animation, scrubber, grid overview)
   - replace the slides inside `<div class="deck">…</div>` with the user's content
4. Use only components from the catalog below. Don't invent new components — if you need a new shape, compose existing ones with inline styles when necessary (the example does this).
5. Wrap each major content block on a slide in `<div class="anim">…</div>` for the staggered fade-in. Keep slides to 2–6 anim blocks.
6. For each slide pick a theme: `slide--dark`, `slide--black`, `slide--light`, or `slide--white`. Vary themes across the deck for visual rhythm.
7. **First and closing slides should use word-reveal headlines** — see the "Word-Reveal Headlines" section.
8. Update the slide counter total: `<div class="counter"><span class="counter__cur" id="curSlide">01</span> / NN</div>` where NN is the slide count.
9. Write to disk at the path the user gave (default `./presentation.html`).

## Inputs to Gather

Ask the user for:

| Input | Required | Notes |
|---|---|---|
| `title` | yes | Used in `<title>`. |
| `language` | optional | Sets `<html lang>`. Default `en`. |
| `default_theme_color` | optional | First-slide theme color for `<meta name="theme-color">`. Default `#0a0a0a`. |
| `slides` | yes | Ordered array — see structure below. |
| `word_reveal_headlines` | optional | Map of `{ id: ['word', 'array'] }` for slides with animated word reveals (typically 2–3 slides: hook, key statement, closing). |

For each `slide`:

| Field | Notes |
|---|---|
| `theme` | One of `dark`, `black`, `light`, `white`. |
| `kind` | One of: `hook`, `summary`, `thesis`, `comparison`, `flywheel`, `arch`, `comparison-cards`, `factory`, `niche-cloud`, `team`, `match`, `ask`, `proof`, `closing`. Maps to a template. |
| `content` | Shape depends on `kind` (see catalog). |

## Theming

CSS variables at `:root` define the palette (same as slim-tabbed). To rebrand:

- For dark/black slides: `--white`, `--black`, `--gray*`
- For light/white slides: `--foreground`, `--background`, `--secondary`, `--card`, `--border`, `--muted-foreground`

The example uses **monochrome grayscale** intentionally. If the user wants brand color accents, replace the `--white` accent (used for `.comp-card--hi`, `.match-bridge__icon`, `.niche-tag--hi`, etc.) with the brand color.

## Word-Reveal Headlines

The opening, climactic, and closing slides use animated word reveals. Each word fades in with a staggered delay.

```html
<!-- In the slide -->
<div class="anim"><h1 class="headline" id="hl1"></h1></div>

<!-- In the JS at the bottom -->
const headlines = {
  hl1: ['SaaS', 'is', '<em>not</em>', 'dead.'],
  hl8: ['We', 'want', 'to', '<em>industrialize</em>', 'this.'],
  hlClosing: ["Let's", '<em>Sprint</em>', 'together.']
};
```

The `buildHL` function wraps each word in `<span class="reveal-word" style="transition-delay:Xs">` and the slide's `.active` class triggers the cascade. To add a new word-reveal headline:
1. Give the `<h1>` an `id` (e.g. `hl-closing`)
2. Add an entry in the `headlines` object with the words
3. The function auto-runs on page load

`<em>` inside a word renders that word in a muted color via the existing CSS — use it for "not", "industrialize", "Sprint" emphasis.

## Component Catalog

All content placed directly inside a `<section class="slide">` should be wrapped in `<div class="anim">…</div>`.

### `headline`
Big title. Use size variants for shorter text.
```html
<h2 class="headline">Big title</h2>
<h2 class="headline headline--sm">Smaller</h2>
<h2 class="headline headline--md">Medium</h2>
```

### `subline` + helpers
```html
<p class="subline text-white-soft">Lead paragraph (use on dark slides).</p>
<p class="subline text-gray">Lead paragraph (use on light slides).</p>
```

### `label`
Eyebrow above headline. Auto-themed by parent slide class.
```html
<div class="label">SECTION LABEL</div>
```

### `summary-row`
Clickable outline row that jumps to another slide via `data-goto="N"` (zero-indexed slide number).
```html
<div class="summary-row" data-goto="2">
  <span class="summary-row__num">01</span>
  <span class="summary-row__text">Statement of point one</span>
</div>
```
Best as a TOC slide right after the hook.

### `comp-card` (3-up comparison)
Use for "three responses / three options / three approaches" with one highlighted as "what we build".
```html
<div class="anim" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;max-width:960px;width:100%">
  <div class="comp-card comp-card--dim">
    <div class="comp-label">Option A</div>
    <div class="comp-row"><svg class="comp-icon">…</svg><span>Statement.</span></div>
    <div class="comp-row"><svg class="comp-icon">…</svg><span>Statement.</span></div>
    <div style="margin-top:14px"><span style="font-family:var(--font-h);font-weight:700;font-size:11px;letter-spacing:0.1em;color:var(--gray3);text-transform:uppercase;padding:4px 10px;border:1px solid var(--dark-border);border-radius:4px">EXAMPLE BRAND</span></div>
  </div>
  <div class="comp-card comp-card--dim">…</div>
  <div class="comp-card comp-card--hi" data-badge="WHAT WE BUILD">…</div>
</div>
```

### `s2-grid`
3-column block grid; the third block can be `s2-block--accent`.
```html
<div class="s2-grid anim">
  <div class="s2-block">
    <div class="s2-icon"><svg>…</svg></div>
    <div class="s2-block-title">Title</div>
    <div class="s2-block-body">Body text.</div>
  </div>
  <div class="s2-block">…</div>
  <div class="s2-block s2-block--accent">…</div>
</div>
```

### `card-grid`
Generic icon + title + body cards. Use `--2`, `--3`, or `--4` for column count.
```html
<div class="anim card-grid card-grid--3" style="max-width:860px">
  <div class="card">
    <div class="card__icon"><svg>…</svg></div>
    <div class="card__title">Title</div>
    <div class="card__body">Body.</div>
  </div>
</div>
```
For a "highlighted" card on light slides, override colors inline:
```html
<div class="card" style="border-color:var(--primary);background:var(--primary);color:var(--primary-foreground)">
  <div class="card__title" style="color:var(--primary-foreground)">…</div>
  <div class="card__body" style="color:rgba(255,255,255,0.7)">…</div>
</div>
```

### `flywheel`
Linear flow with arrows. Used as a process visualization.
```html
<div class="anim" style="max-width:860px;width:100%">
  <div class="flywheel">
    <div class="flywheel__step">Step<br>one</div>
    <div class="flywheel__arrow">→</div>
    <div class="flywheel__step">Step<br>two</div>
    <div class="flywheel__arrow">→</div>
    <div class="flywheel__step">Step<br>three</div>
  </div>
</div>
```

### `factory-flow`
5-step numbered flow.
```html
<div class="anim factory-flow">
  <div class="factory-step">
    <div class="factory-step__num">01</div>
    <div class="factory-step__label">Step name</div>
  </div>
  <!-- repeat × 5 -->
</div>
```

### `arch-layers`
Vertical stacked layers — use for "where we sit in the stack".
```html
<div class="anim arch-layers">
  <div class="arch-layer arch-layer--top">
    <span>Top layer</span>
    <span class="arch-layer__tag">Tag</span>
  </div>
  <div class="arch-layer arch-layer--mid">…</div>
  <div class="arch-layer arch-layer--us">
    <span>Our layer</span>
    <span class="arch-layer__tag">WE ARE HERE</span>
  </div>
</div>
```

### `match-grid`
"What X does ↔ what we add" with bridge icon.
```html
<div class="anim match-grid">
  <div class="match-col">
    <div class="match-col__title">What they do</div>
    <ul class="match-col__items"><li>Item</li></ul>
  </div>
  <div class="match-bridge">
    <div class="match-bridge__icon"><svg>arrow</svg></div>
  </div>
  <div class="match-col" style="border-color:var(--primary);background:var(--card);box-shadow:0 0 0 1px var(--primary)">
    <div class="match-col__title">What we add</div>
    <ul class="match-col__items"><li>Item</li></ul>
  </div>
</div>
```

### `niche-cloud` / `niche-tag`
Flexible tag cloud. `--hi` for highlighted (current focus) tags.
```html
<div class="anim niche-cloud">
  <span class="niche-tag niche-tag--hi">Primary niche</span>
  <span class="niche-tag">Secondary</span>
  <span class="niche-tag" style="color:var(--gray3)">…</span>
</div>
```

### `metrics` (with auto-counters)
3-column number tiles. `data-count` for animated count-up; `data-text` for delayed text reveal.
```html
<div class="metrics anim" style="grid-template-columns:repeat(3,1fr);max-width:520px">
  <div class="metric">
    <div class="metric__val" data-count="5000" data-prefix="€" data-format="comma">0</div>
    <div class="metric__label">Setup fee</div>
  </div>
  <div class="metric">
    <div class="metric__val" data-count="6">0</div>
    <div class="metric__label">Leads</div>
  </div>
  <div class="metric">
    <div class="metric__val" data-text=">80%">-</div>
    <div class="metric__label">Margin</div>
  </div>
</div>
```
**Wiring note:** the example only animates counters when `current === 12`. To animate counters on any slide that has them, change the JS condition to: `setTimeout(animateCounters, 300);` always, since `animateCounters()` already scopes to `.slide.active`.

### `thesis-statement`
Boxed bold statement, used as a slide closer.
```html
<div class="anim"><div class="thesis-statement">Big closing statement. <strong>Punchy phrase.</strong></div></div>
```
For light slides override colors: `style="border-color:var(--border);background:var(--card)"`.

### `sp-*` spacers
Vertical gaps between blocks, controlled by helper classes (define in CSS or use inline `<div style="height:24px"></div>`):
```html
<div class="sp-16"></div>
<div class="sp-24"></div>
<div class="sp-32"></div>
```

## Required global UI elements (do not remove)

These live outside the `<div class="deck">` and are wired by the script:

```html
<div class="progress" id="progress"></div>
<div class="scrubber-zone" id="scrubberZone"></div>
<div class="scrubber-preview" id="scrubberPreview">
  <div class="scrubber-preview__inner" id="scrubberInner"></div>
  <div class="scrubber-preview__label" id="scrubberLabel"></div>
</div>
<div class="counter"><span class="counter__cur" id="curSlide">01</span> / NN</div>
<div class="grid-overlay" id="gridOverlay"></div>
<div class="nav">
  <button class="nav__btn" id="prevBtn">…</button>
  <button class="nav__btn" id="nextBtn">…</button>
  <div class="grid-slider-wrap">
    <div class="grid-slider" id="gridSlider"><input type="range" id="gridSizeRange" min="200" max="500" value="340"></div>
    <button class="nav__btn" id="gridBtn">…</button>
  </div>
</div>
```

Update `NN` to the actual slide count.

## JS Behaviors (don't break these)

- **Navigation** — `goTo(i)` advances; bound to keyboard, prev/next buttons, swipe, wheel/trackpad scroll, scrubber click, summary-row click
- **Word-reveal** — `buildHL(id, words)` runs once on load for every entry in the `headlines` object
- **Counter animation** — `animateCounters()` scopes to `.slide.active .metric__val[...]`, runs after slide change for slide 12 (generalize as noted above)
- **Theme color update** — `updateUI()` reads `slide--light` / `slide--white` classes from the active slide and updates `meta[name=theme-color]`, nav button color, counter color
- **Scrubber preview** — clones the slide DOM under cursor X position, scales to 240×150 thumbnail, shows above bottom edge
- **Grid overview** — clones every slide as a thumbnail, opens via grid button, closes via Escape
- **Wheel / trackpad scroll** — scrolling down or right advances, up or left goes back. `wheelLock` + `wheelAccum` threshold (40px) gate firing rate so trackpad inertia does not skip multiple slides per gesture. Disabled while the grid overview is open.

## Pitfalls

- **Forgetting `.anim` wrappers** → content jumps in without animation
- **Wrong slide count in counter** → update the `/ NN` text manually
- **Adding a slide without updating `data-slide` attribute** → JS uses `querySelectorAll('.slide')` so order is by DOM position; `data-slide` is informational. Still keep it consistent.
- **Word-reveal headline with no entry in `headlines` object** → renders empty
- **Counter only firing on slide 12** → generalize the trigger if metrics live elsewhere
- **Removing the global UI elements** (`#progress`, `#scrubberZone`, `#counter`, `#gridOverlay`, `#nav`) → JS errors silently and navigation breaks
- **Dropping `pointer-events: none` on closed `.grid-overlay`** → cloned slides inside grid tiles carry `visibility: visible !important` (from the scrubber/grid preview rules), which overrides the parent's `visibility: hidden` and leaves phantom click zones on the main deck. The overlay must be `pointer-events: none` by default and `pointer-events: auto` only on `.grid-overlay.open`.
- **Inline-styling that overrides the theme** → cards on `slide--light` need explicit `border-color:var(--border)` since the default CSS targets `slide--dark`/`--black`
- **Long words in word-reveal headlines** → spans don't wrap mid-word; keep words ≤ 12 chars
- **Wrong meta theme-color initial value** → match the first slide's background

## Output Checklist

Before declaring done, confirm:

- [ ] Single `.html` file, no external assets beyond Google Fonts CDN
- [ ] `<title>` matches the user's title
- [ ] First slide and closing slide use word-reveal headlines (recommended)
- [ ] Each slide has a theme class (`slide--dark|black|light|white`)
- [ ] Counter total `/ NN` matches actual slide count
- [ ] All global UI elements present (`#progress`, `#scrubberZone`, `#scrubberPreview`, `#counter`, `#gridOverlay`, `#nav`)
- [ ] Each content block wrapped in `<div class="anim">`
- [ ] Word-reveal headlines have entries in the `headlines` object
- [ ] Counter trigger generalized if metrics are not exclusively on slide 13
- [ ] No fabricated metrics, names, quotes — all gathered from the user
