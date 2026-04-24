---
name: generate-presentation
description: Generate an HTML presentation in one of several built-in visual styles. Each style ships with a complete reference example HTML and a build guide. Output is either a single self-contained .html file or a folder (index.html + assets/) depending on whether the deck needs local images, videos, or 3D content. Use this when the user asks for slides, a deck, a pitch, a presentation, a talk, or any visual narrative they'll show on screen.
---

# Generate Presentation

This skill creates either a single self-contained `.html` file or a folder (entry HTML plus sibling assets) that the user can open in any browser. Slideless v3 accepts folders with any layout — relative paths like `./hero.jpg` or `./three/scene.js` resolve the same way they would on a static webserver.

When to output a folder vs a single HTML file:
- **Single HTML file** — text-only decks, or decks using only inline SVG. Maximum portability (one file, self-contained), ≤ 10 MB.
- **Folder** — any deck with raster images, video, GIFs, 3D models (glTF), shaders, or separate CSS/JS bundles. Layout is free-form; no forced `/assets/` subfolder.

External CDN dependencies (Google Fonts, unpkg, jsDelivr) remain valid in either mode — the viewer's browser fetches them at runtime.

The skill ships with a `styles/` folder. Each style is a complete, opinionated visual system with its own components, animations, and navigation paradigm. Picking the right style is the most important decision — the rest is following the style's build guide.

## Discovery Strategy

Style guides and reference examples are bundled inside this skill's `styles/` directory. Run these checks in order to find them:

1. **Search for the style index** — Use Glob to find: `**/generate-presentation/styles/README.md`
2. **Check common install paths** — Search for `**/slideless/skills/generate-presentation/styles/README.md`

Once found, store the `styles/` base path and use it for all subsequent reads.

If none found, tell the user: "I can't find the slideless style guides. Make sure the `slideless` plugin is installed (`npx plugins add slideless-ai/plugin`)."

## Directory Structure

```
skills/generate-presentation/
├── SKILL.md                         ← This file
└── styles/
    ├── README.md                    ← Style picker — read first
    ├── slim-tabbed/
    │   ├── README.md                ← When to pick + audience
    │   ├── how-to-build.md          ← Components, CSS vars, JS, generation pattern
    │   └── example.html             ← Production reference — SOURCE OF TRUTH
    └── full-deck/
        ├── README.md
        ├── how-to-build.md
        └── example.html
```

## Available Styles

| Style | Path | Pick when |
|-------|------|-----------|
| `slim-tabbed` | `styles/slim-tabbed/` | Workshop, internal alignment, content-heavy reading. Sidebar nav, scrollable panels, light/dark theme toggle. |
| `full-deck` | `styles/full-deck/` | Pitch deck, conference talk, recorded presentation. Full-screen slides, word-reveal animations, grid overview, swipe + keyboard nav. |

## Recommended Reading Order

For every generation request:

1. `styles/README.md` — pick the right style (or confirm the user's choice)
2. `styles/<style>/README.md` — confirm style fits the use case
3. `styles/<style>/how-to-build.md` — the generation pattern, slide template catalog, generation inputs
4. `styles/<style>/example.html` — the source of truth. Every CSS class, JS handler, and slide template you generate must match what's in this file.

**Critical:** The `example.html` is the ground truth. When the build guide and the example disagree, follow the example. When you're unsure how a component should look, copy its HTML/CSS/JS verbatim from the example and adapt the content.

## Generation Workflow

1. **Pick the style** (or confirm the user's choice). If unsure, ask: "Workshop / internal (slim-tabbed) or pitch / talk (full-deck)?"
2. **Gather inputs** for the chosen style — see its `how-to-build.md` for the exact shape (sections, slides, brand colors, founders, metrics, etc.). Ask the user for missing pieces; don't fabricate factual content (company names, metrics, quotes).
3. **Read the example.html** in full — this is non-negotiable. Skim it for the patterns you'll reuse.
4. **Compose the HTML** by adapting the example's templates with the user's content. Keep the example's CSS, JS, fonts, and layout primitives. Replace only the content blocks.
5. **Write to disk** at the path the user requested.
   - Single-file mode (default): `./presentation.html`
   - Folder mode (when the deck uses local images/video/3D): create a folder like `./presentation/` with `index.html` at its root and sibling asset files at any paths the HTML references. No forced `/assets/` convention — `./hero.jpg`, `./images/hero.jpg`, and `./media/hero.jpg` all work; match what the HTML's `src=` attributes point at.
6. **Tell the user how to view it**: open the `.html` in a browser (single-file) or open the `index.html` (folder) — both modes render identically.
7. **Optionally suggest sharing** via the `share-presentation` skill. Pass the file (single-file mode) or the folder path (folder mode) as `source_path`.

## Using local assets

When the user supplies images, video, or 3D models, save them alongside the HTML in the folder. Use relative paths in the HTML:

```html
<img src="./hero.jpg" alt="Hero">
<video src="./media/demo.mp4" controls></video>
<link rel="preload" as="fetch" href="./three/model.glb" crossorigin>
```

Do NOT reference anything outside the folder (`../anywhere`) — the deck must be self-contained within its root. CDN/external URLs (`https://...`) are fine.

### Custom fonts

Two options:

1. **Google Fonts / Fontshare / Adobe Fonts** — `<link href="https://fonts.googleapis.com/css2?family=...">`. Simplest path. Works in both single-file and folder mode. Zero quota cost.
2. **Bundled font files** — folder mode only. Put `.woff2` files inside the deck, reference them via `@font-face { src: url('./fonts/MyFont.woff2') format('woff2'); }`. `.woff2` is the right default (widely supported, ~60% smaller than TTF).

Ship `.woff2` only unless the user explicitly needs older-browser fallbacks. Set `font-display: swap` so text stays visible while fonts load. Don't mix self-hosted and CDN for the same family unless the user asks.

Ask the user which they want if brand fonts come up — licensing and offline behavior usually drive the choice.

## Don'ts

- Don't add heavyweight CSS/JS frameworks to single-file decks (no Tailwind CDN, no Reveal.js, no jQuery)
- Don't fabricate data (metrics, founder names, quotes, dates) — ask
- Don't strip the example's accessibility, keyboard nav, or responsive CSS
- Don't claim the deck is done without writing it to disk
- Don't reference paths outside the deck folder — `../` refs are rejected at upload time

## When to Use the Share Skill

After generating, if the user wants to share the presentation publicly (sales prospect, investor, conference attendee), invoke `share-presentation` with the path to the generated file. It returns a public link.
