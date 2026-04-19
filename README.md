# Slideless Marketplace

Public Claude Code plugin marketplace for generating, hosting, and sharing beautiful HTML presentations from any agent. Backed by [slideless-ai](https://slideless-ai.web.app) (a standalone Firebase project).

## What's Inside

One plugin, `slideless`, with seven skills covering the full lifecycle:

| Skill | What it does |
|---|---|
| `setup-slideless` | Get an API key from the slideless-ai dashboard, store it in `~/.codika/.env`, verify it works. Run this **first**. |
| `generate-presentation` | Generate a self-contained `.html` presentation in one of several built-in visual styles. Each style ships with a complete reference example and a build guide. |
| `share-presentation` | Upload a generated `.html` file to slideless-ai and get a public share URL with view tracking. |
| `update-presentation` | Replace the HTML of an existing share **in place** — same URL, view counts preserved, version bumps. Use after re-generating or editing a deck. |
| `list-presentations` | List all of your shared presentations with title, view count, share URL. |
| `get-presentation` | Fetch full metadata for a single presentation: per-token view counts, status, all share URLs. |
| `export-presentation-pdf` | Convert a generated `.html` deck into a `.pdf` via a bundled Puppeteer runner. Handles `full-deck` slides mechanically and restructures `slim-tabbed` decks so each tab becomes its own page. |

## Lifecycle at a glance

```
setup-slideless (once)
  ↓
generate-presentation → ./deck.html
  ↓
share-presentation ./deck.html "Q4 board"
  ↓
  → returns shareUrl + shareId
  ↓
[recipients open the URL]
  ↓
list-presentations / get-presentation <shareId>     (track views)
  ↓
update-presentation <shareId> ./deck-v2.html        (re-publish, same URL)
```

## Bundled Styles

The `generate-presentation` skill ships with two complete reference styles:

| Style | Use it for |
|---|---|
| `slim-tabbed` | Workshops, internal alignments, content-heavy decks where reading comprehension matters more than spectacle. Sidebar-driven navigation, theme toggle, scrollable panels. |
| `full-deck` | Investor pitches, conference talks, recorded presentations. Cinematic full-screen slides with word-reveal animations, grid overview, scrubber preview, swipe support. |

Each style lives in its own folder under `plugins/slideless/skills/generate-presentation/styles/<style>/` containing:
- `README.md` — when to pick this style and what it's good for
- `how-to-build.md` — every component, CSS variable, JS behavior the agent needs to reproduce the look
- `example.html` — a complete production-quality reference presentation, source of truth for HTML/CSS/JS patterns

## Install

```bash
/plugin marketplace add slideless-ai/marketplace
/plugin install slideless@slideless-marketplace
```

## Quickstart

```
> /slideless:setup-slideless
[follow the steps to create an API key at slideless-ai.web.app and save it to ~/.codika/.env]

> use slideless to generate a 7-slide deck about <topic> in full-deck style, save to ./deck.html

> share that presentation as "<title>"
[returns: https://europe-west1-slideless-ai.cloudfunctions.net/getSharedPresentation/<shareId>?token=…]
```

## Adding a New Style

1. Create `plugins/slideless/skills/generate-presentation/styles/<style-name>/`
2. Add `README.md`, `how-to-build.md`, and `example.html`
3. Register the style in `plugins/slideless/skills/generate-presentation/styles/README.md`
4. Update the table above

## License

MIT
