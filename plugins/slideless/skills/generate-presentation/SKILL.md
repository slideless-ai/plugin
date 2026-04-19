---
name: generate-presentation
description: Generate a self-contained HTML presentation in one of several built-in visual styles. Each style ships with a complete reference example HTML and a build guide. Use this when the user asks for slides, a deck, a pitch, a presentation, a talk, or any visual narrative they'll show on screen.
---

# Generate Presentation

This skill creates a single self-contained `.html` file the user can open in any browser. It does **not** use external libraries — everything (CSS, JS, fonts) is either inline or loaded from a public CDN (Google Fonts only).

The skill ships with a `styles/` folder. Each style is a complete, opinionated visual system with its own components, animations, and navigation paradigm. Picking the right style is the most important decision — the rest is following the style's build guide.

## Discovery Strategy

Style guides and reference examples are bundled inside this skill's `styles/` directory. Run these checks in order to find them:

1. **Search for the style index** — Use Glob to find: `**/generate-presentation/styles/README.md`
2. **Check common install paths** — Search for `**/slideless/skills/generate-presentation/styles/README.md`

Once found, store the `styles/` base path and use it for all subsequent reads.

If none found, tell the user: "I can't find the slideless style guides. Make sure the `slideless` plugin is installed from the slideless marketplace."

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
5. **Write to disk** at the path the user requested (default: `./presentation.html`).
6. **Tell the user how to view it**: open in a browser; mention the keyboard shortcuts and any interactive features the chosen style supports.
7. **Optionally suggest sharing** via the `share-presentation` skill if the user wants a public link.

## Don'ts

- Don't add external CSS/JS frameworks (no Tailwind CDN, no Reveal.js, no jQuery)
- Don't fabricate data (metrics, founder names, quotes, dates) — ask
- Don't strip the example's accessibility, keyboard nav, or responsive CSS
- Don't claim the file is done without writing it to disk
- Don't claim the file works without spot-checking the markup matches the style's example pattern

## When to Use the Share Skill

After generating, if the user wants to share the presentation publicly (sales prospect, investor, conference attendee), invoke `share-presentation` with the path to the generated file. It returns a public link.
