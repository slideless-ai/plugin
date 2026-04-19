# Slim Tabbed — Editorial workshop deck

Sidebar-driven, content-first. Each "slide" is a numbered tab in the left sidebar; clicking it reveals a vertically scrollable panel of content blocks. Optimized for reading comprehension and discussion, not visual spectacle.

## Pick this style when

- The audience will **read and discuss** the deck (workshop, internal sync, strategy alignment, partnership conversation)
- Content is dense — long paragraphs, multiple sub-sections, founder bios, side-by-side comparisons
- The user wants a **light/dark theme toggle** so it works in any room
- The deck will be re-read or skimmed asynchronously after the meeting
- 5–10 sections, each holding multiple content blocks

## Don't pick this style when

- You want a cinematic, animated pitch deck → use `full-deck/`
- The deck is a sales close where pacing matters
- Each "slide" should be a single big idea, not a multi-block panel

## What you get

- **Sidebar navigation** — numbered tabs (01, 02, …) with section labels, fixed on the left (becomes a horizontal strip on mobile)
- **Cover splash** — clickable splash screen on load, returnable via the header logo
- **Theme toggle** — built-in light/dark switch in the header, persisted in `meta[name="theme-color"]`
- **Hash-based URL state** — `#slide=3` links directly to a tab; back/forward works
- **Keyboard navigation** — `1`–`9` jump to tabs; `↑↓←→` step through
- **Footer keyboard hint** — visible kbd shortcut legend
- **Content reveal animation** — staggered fade + blur-in for content blocks (`.anim` wrapper)
- **Counter animations** — metric values count up smoothly when their tab opens
- **Image lightbox** — click-to-zoom on any wrapped image
- **Responsive** — collapses to single-column with horizontal tabs at ≤900px

## Component library

Available content blocks (full HTML/CSS in `example.html`, build patterns in `how-to-build.md`):

- `headline` / `subline` / `label` — typographic primitives
- `founders` (avatar + name + role + bullet list)
- `s2-grid` 3-column block grid with optional accent block
- `card-grid--2` / `card-grid--3` — generic icon + title + body cards
- `thesis-box` — large bold statement
- `insight-box` — quoted/highlighted prose
- `match-grid` — "what they do ↔ what we add" with bridge icon
- `metrics` — 3-column number tiles with count-up animation
- `compound-viz` — 5-column step flow with bridge icons
- `ba-grid` — before/after comparison
- `arch-layers` — vertical stacked layer cards
- `factory-flow` — 5-step linear flow with arrows
- `quote-box` — italicized quote with source
- `deliverables-box` — small framed list
- `zoomable-wrap` — lightbox-able image

## Reference

`example.html` in this folder is a complete production deck (Codika × Hexa Sprint, FR). Treat it as ground truth: every component above is used at least once. When generating, **read it in full** before composing new content.

Next: read `how-to-build.md` for the generation pattern and inputs.
