# Slideless Plugin

Agent plugin for generating, hosting, and sharing HTML presentations — single HTML files or folders with images, video, 3D assets — from any Claude- or Cursor-compatible coding agent. Backed by [slideless](https://slideless.ai), with all backend operations going through the official `slideless` CLI.

Conforms to the [Open Plugin Specification v1.0](https://github.com/vercel-labs/open-plugin-spec), so it installs into any Open-Plugin-compatible host.

## What's Inside

One plugin, `slideless`, with skills covering the full lifecycle:

| Skill | What it does |
|---|---|
| `setup-slideless` | Install the `slideless` CLI and attach a `cko_` key. Prefers the OTP flow (`slideless auth signup-request` / `login-request` + matching `-complete`); falls back to pasting a dashboard key. Run this **first**. |
| `generate-presentation` | Generate an HTML presentation in one of several built-in visual styles. Output is either a single `.html` or a folder with sibling assets (images, video, 3D models, CSS, JS) depending on what the deck needs. |
| `push-presentation` | Upload a deck (folder or single HTML file). First push creates a new presentation and writes `slideless.json` at the deck root; subsequent pushes from the same folder re-publish to the same `presentationId` with view counts preserved. |
| `pull-presentation` | Download a deck to a local folder (writes `slideless.json` so a subsequent `push` re-publishes in place). Works for owners on another machine and for invited dev collaborators. |
| `share-presentation` | Mint a public viewer URL for an existing presentation. Mint as many named tokens as you need (one per recipient for per-recipient tracking). |
| `unshare-presentation` | Revoke viewer URLs — one token with `--token`, or every token without. The deck stays editable. |
| `delete-presentation` | Hard-delete a presentation: Firestore doc, every version, every asset, every collaborator row. Irreversible. |
| `invite-collaborator` | Invite a dev collaborator by email. They gain push + pull access once they have a Slideless account (auto-claims on signup if they don't). |
| `uninvite-collaborator` | Revoke a dev collaborator. Revocation is immediate. |
| `share-presentation-email` | Email an existing shared presentation to 1–20 recipients. Each recipient gets a unique named link so the sender can track per-recipient opens. |
| `list-presentations` | List every deck you can access — owned plus shared-with-you. Each row carries a `role` column. |
| `get-presentation` | Fetch full metadata for a single presentation: per-token view counts, `versionMode`, share URLs, and (for owners) the collaborator list. |
| `export-presentation-pdf` | Convert a local HTML deck into a PDF via a bundled Puppeteer runner. |
| `browse-marketplace` | Search and filter the public marketplace for remixable templates and tools. No API key required. |
| `remix-template` | Download a marketplace listing into a fresh, unlinked folder so the user can make it their own. No API key required. |
| `publish-to-marketplace` | Publish a pushed deck to the public marketplace as a `template` or `tool`. Requires a key with the `marketplace:publish` scope. |

## Lifecycle at a glance

```
setup-slideless (once)
  ↓
generate-presentation → ./deck/ (folder with index.html + assets) OR ./deck.html
  ↓
push-presentation ./deck "Q4 board"
  ↓
  → returns presentationId, writes slideless.json at the deck root
  ↓
share-presentation <presentationId>                                 (mint a public viewer URL)
  ↓
  → returns shareUrl + tokenId
  ↓
share-presentation-email <presentationId> alice@x.com bob@y.com     (optional: email it out)
  ↓
[recipients open the URL; images, video, 3D assets load natively]
  ↓
list-presentations / get-presentation <presentationId>              (track views — per-recipient)
  ↓
share-presentation <presentationId> --name "Acme Corp"              (optional: extra recipient link)
  ↓
invite-collaborator <presentationId> --email teammate@x.com         (optional: grant edit access)
  ↓
push-presentation ./deck                                     (re-publish from same folder, dedup)
  ↓
unshare-presentation <presentationId> [--token <tokenId>]           (revoke one or every viewer URL)
  ↓
delete-presentation <presentationId>                                (hard-delete, irreversible)
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

> push that presentation as "<title>"
[skill runs `slideless push ./deck --title "<title>" --json` and returns the presentationId + writes slideless.json]

> share a public link
[skill runs `slideless share <presentationId> --json` and returns the viewer URL]
```

## Adding a New Style

1. Create `skills/generate-presentation/styles/<style-name>/`
2. Add `README.md`, `how-to-build.md`, and `example.html`
3. Register the style in `skills/generate-presentation/styles/README.md`
4. Update the table above

## License

MIT
