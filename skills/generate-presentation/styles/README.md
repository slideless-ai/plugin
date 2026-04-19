# Presentation Styles

Each style is a complete visual system with its own navigation paradigm, components, and animations. Pick the one that matches the audience and setting, then follow its `how-to-build.md` and treat its `example.html` as the source of truth.

## Quick Picker

Ask yourself: **how will the audience consume this?**

| Audience consumes by... | Pick |
|---|---|
| Reading and discussing in a room or on a call (workshop, internal sync) | `slim-tabbed` |
| Watching slides advance on a screen (pitch, talk, demo, recording) | `full-deck` |

If unsure, ask the user: "Workshop / internal (slim-tabbed) or pitch / talk (full-deck)?"

## Styles

### `slim-tabbed/` — Editorial workshop deck

Sidebar-driven navigation with numbered tabs. Each "slide" is a vertically scrollable panel of content blocks. Optimized for reading comprehension over visual spectacle.

- Sidebar tabs (01–07 numbering), keyboard shortcuts (1–9 + arrows)
- Light/dark theme toggle
- Scrollable panels, no full-screen takeover
- Component library: founder cards, 3-col grids, before/after, insight boxes, compounding flows, metrics with counters, architecture layers, image lightbox

**Best for:** internal team alignment, workshops, dense strategic decks, anything someone might want to read at their own pace.

[See `slim-tabbed/README.md` →](./slim-tabbed/README.md)

### `full-deck/` — Cinematic pitch deck

Full-screen slides with smooth fade transitions, word-reveal headline animations, grid overview (press G), and a hover-scrubber preview at the bottom. Three per-slide themes (dark / light / white).

- Keyboard nav (arrows, space, number keys), swipe gestures, click-to-jump scrubber
- Per-slide theme switching with auto-updating browser theme color
- Component library: animated titles, summary rows, comparison cards, feature grids, metrics with auto-counters, niche tag clouds, flywheel, thesis blocks, quotes, pillar cards

**Best for:** investor pitches, conference talks, sales demos, recorded explainers, anything where polish and pacing matter.

[See `full-deck/README.md` →](./full-deck/README.md)

## Adding a New Style

1. Create a sibling folder (e.g. `styles/minimal-mono/`)
2. Add `README.md` (when-to-pick), `how-to-build.md` (component & generation guide), `example.html` (production reference)
3. Add a row to the picker table above and a section below
4. Add a row to the `Available Styles` table in `../SKILL.md`
