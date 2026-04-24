# Slideless Plugin

Agent plugin for generating, hosting, and sharing HTML presentations — single HTML files or folders with images, video, 3D assets — from any Claude- or Cursor-compatible coding agent. Backed by [slideless](https://slideless.ai), with all backend operations going through the official `slideless` CLI.

Conforms to the [Open Plugin Specification v1.0](https://github.com/vercel-labs/open-plugin-spec), so it installs into any Open-Plugin-compatible host.

## What's Inside

One plugin, `slideless`, with skills covering the full lifecycle:

| Skill | What it does |
|---|---|
| `setup-slideless` | Install the `slideless` CLI and attach a `cko_` key. Prefers the OTP flow (`slideless auth signup-request` / `login-request` + matching `-complete`); falls back to pasting a dashboard key. Run this **first**. |
| `generate-presentation` | Generate an HTML presentation in one of several built-in visual styles. Output is either a single `.html` or a folder with sibling assets (images, video, 3D models, CSS, JS) depending on what the deck needs. |
| `share-presentation` | Upload a deck (folder or single HTML file) to slideless and get a public share URL with view tracking. Relative asset paths resolve natively for viewers. |
| `share-presentation-email` | Email an existing shared presentation to 1–20 recipients. Each recipient gets a unique named link so the sender can track per-recipient opens. |
| `update-presentation` | Replace the deck behind an existing share **in place** — same URL, view counts preserved, version bumps, unchanged assets deduplicated by SHA-256. |
| `list-presentations` | List all your shared presentations with title, view count, share URL. |
| `get-presentation` | Fetch full metadata for a single presentation: per-token view counts, `versionMode`, all share URLs. |
| `add-presentation-token` | Mint a new named share token on an existing presentation so the user can send a fresh, separately trackable link to a specific recipient. |
| `revoke-presentation` | Revoke a single recipient's token or archive the whole presentation. |
| `export-presentation-pdf` | Convert a local HTML deck into a PDF via a bundled Puppeteer runner. |

## Lifecycle at a glance

```
setup-slideless (once)
  ↓
generate-presentation → ./deck/ (folder with index.html + assets) OR ./deck.html
  ↓
share-presentation ./deck "Q4 board"
  ↓
  → returns shareUrl + shareId
  ↓
share-presentation-email <shareId> alice@x.com bob@y.com   (optional: email it out)
  ↓
[recipients open the URL; images, video, 3D assets load natively]
  ↓
list-presentations / get-presentation <shareId>            (track views — per-recipient)
  ↓
add-presentation-token <shareId> "Acme Corp"               (optional: extra recipient link)
  ↓
update-presentation <shareId> ./deck                       (re-publish, same URL, dedup)
  ↓
revoke-presentation <shareId> [--token <tokenId>]          (cut off a recipient or archive)
```

## Bundled Styles

The `generate-presentation` skill ships with two complete reference styles:

| Style | Use it for |
|---|---|
| `slim-tabbed` | Workshops, internal alignments, content-heavy decks where reading comprehension matters more than spectacle. Sidebar-driven navigation, theme toggle, scrollable panels. |
| `full-deck` | Investor pitches, conference talks, recorded presentations. Cinematic full-screen slides with word-reveal animations, grid overview, scrubber preview, swipe support. |

Each style lives in its own folder under `skills/generate-presentation/styles/<style>/` containing:
- `README.md` — when to pick this style and what it's good for
- `how-to-build.md` — every component, CSS variable, JS behavior the agent needs to reproduce the look
- `example.html` — a complete production-quality reference presentation, source of truth for HTML/CSS/JS patterns

## Install

### Any Open-Plugin-compatible host (Claude Code, Cursor, …)

```bash
npx plugins add slideless-ai/plugin
```

The `plugins` CLI auto-detects which agent tools are installed and installs to all of them.

### Claude Code (native)

```
/plugin marketplace add slideless-ai/plugin
/plugin install slideless@plugin
```

Both paths produce the same `/slideless:*` skills — Claude Code prefers the `.claude-plugin/plugin.json` manifest when available, other hosts read `.plugin/plugin.json`.

## Quickstart

```
> /slideless:setup-slideless
[installs the `slideless` CLI, then:
 - emails an OTP to the address you give it (`slideless auth signup-request`)
 - you paste the 6-digit code back, and it finishes with `slideless auth signup-complete`
 - result: a `cko_` key saved to ~/.config/slideless/config.json, ready to go]

> use slideless to generate a 7-slide deck about <topic> in full-deck style
[skill writes either ./deck.html or ./deck/ (folder) depending on what the content needs]

> share that presentation as "<title>"
[skill runs `slideless share ./deck --title "<title>" --json` and returns the public URL]
```

## Adding a New Style

1. Create `skills/generate-presentation/styles/<style-name>/`
2. Add `README.md`, `how-to-build.md`, and `example.html`
3. Register the style in `skills/generate-presentation/styles/README.md`
4. Update the table above

## License

MIT
