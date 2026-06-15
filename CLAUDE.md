# Slideless Plugin

Public agent plugin for generating, sharing, and managing HTML presentations. Published as a single [Open Plugin v1](https://github.com/vercel-labs/open-plugin-spec)-conformant repo, installable via `npx plugins add slideless-ai/plugin` or Claude Code's `/plugin marketplace add` flow.

## Repository Structure

```
.
├── .plugin/
│   └── plugin.json                   # Vendor-neutral manifest (Open Plugin v1)
├── .claude-plugin/
│   └── plugin.json                   # Vendor-prefixed manifest (preferred by Claude Code)
├── skills/
│   ├── setup-slideless/
│   │   └── SKILL.md
│   ├── generate-presentation/
│   │   ├── SKILL.md
│   │   └── styles/
│   │       ├── README.md
│   │       ├── slim-tabbed/
│   │       │   ├── README.md
│   │       │   ├── how-to-build.md
│   │       │   └── example.html
│   │       └── full-deck/
│   │           ├── README.md
│   │           ├── how-to-build.md
│   │           └── example.html
│   ├── push-presentation/
│   │   └── SKILL.md
│   ├── pull-presentation/
│   │   └── SKILL.md
│   ├── share-presentation/
│   │   └── SKILL.md
│   ├── pull-annotations/
│   │   └── SKILL.md
│   ├── apply-annotations/
│   │   └── SKILL.md
│   ├── unshare-presentation/
│   │   └── SKILL.md
│   ├── delete-presentation/
│   │   └── SKILL.md
│   ├── invite-collaborator/
│   │   └── SKILL.md
│   ├── uninvite-collaborator/
│   │   └── SKILL.md
│   ├── share-presentation-email/
│   │   └── SKILL.md
│   ├── list-presentations/
│   │   └── SKILL.md
│   ├── get-presentation/
│   │   └── SKILL.md
│   ├── export-presentation-pdf/
│   │   └── SKILL.md
│   ├── browse-marketplace/
│   │   └── SKILL.md
│   ├── publish-to-marketplace/
│   │   └── SKILL.md
│   ├── remix-template/
│   │   └── SKILL.md
│   └── plan-companion-deck/
│       └── SKILL.md
├── README.md
├── CLAUDE.md
└── LICENSE
```

The repo root IS the plugin root — no `plugins/` wrapper, no marketplace layer. This matches `vercel/vercel-plugin` and is the recommended Open Plugin layout for single-plugin repos.

## Manifests

Two manifests are kept intentionally in sync:

- `.plugin/plugin.json` — canonical Open Plugin v1 manifest. Read by `npx plugins`, Cursor, and any other Open-Plugin-compatible host.
- `.claude-plugin/plugin.json` — Claude Code vendor-prefixed manifest. Per Open Plugin §5.1, Claude Code prefers this when both are present.

When editing manifest metadata (`version`, `description`, `keywords`, …), update BOTH files. Both ship the same schema; the only field that must stay present in `.plugin/` is `repository`.

## Conventions

- Skills must not contain secrets, API keys, or internal URLs (the public Cloud Function URLs are fine — they're auth-gated)
- Every style is a self-contained folder: `README.md` (when to pick it), `how-to-build.md` (how to generate it), `example.html` (production reference)
- The `example.html` for each style is the **source of truth** — when in doubt about a CSS/JS pattern, the build guide must match what's in `example.html`
- Each example must be a single self-contained HTML file with no external dependencies beyond the Google Fonts CDN
- Keep `SKILL.md` files self-contained: each works standalone

## Adding a New Style

1. Create `skills/generate-presentation/styles/<style-name>/`
2. Add `README.md`, `how-to-build.md`, and `example.html`
3. Register the style in `skills/generate-presentation/styles/README.md` (the picker table) and in the SKILL.md style index
4. Update the README.md style table

## Adding a New Skill

1. Create `skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`)
2. The plugin loader picks it up automatically from the default `skills/` discovery location (Open Plugin §7.1) — no manifest edits needed
3. Document it in `README.md`

## Backend Dependency

All non-`generate-presentation` and non-`export-presentation-pdf` skills delegate to the **`slideless` CLI** (npm package ≥ 0.5.0), which wraps the slideless-ai backend's HTTP API. Skills never call curl or hand-roll fetch; the CLI centralises auth, base URL, the three-step upload protocol, error decoding, and JSON output shape.

| Skill | CLI command | Backing endpoint(s) | Required scope |
|---|---|---|---|
| `setup-slideless` | `slideless auth signup-*/login-*` (primary), `slideless login` (fallback), `slideless whoami` / `verify` | `POST /cliRequestSignupOtp`, `/cliCompleteSignup`, `/cliRequestLoginOtp`, `/cliCompleteLogin`, `/verifyApiKey` | (mints its own `cko_` key with `presentations:read` + `presentations:write`) |
| `push-presentation` | `slideless push <folder-or-file>` | `precheckAssets` → `uploadPresentationAsset` → `commitPresentationVersion` | `presentations:write` |
| `pull-presentation` | `slideless pull <presentationId>` | `GET /getPresentationVersion` + `GET /downloadPresentationAsset` | `presentations:read` (owner or dev) |
| `share-presentation` | `slideless share <presentationId> [--name <n>] [--annotator] [--to-version <N>]` | `POST /addPresentationToken` | `presentations:write` |
| `pull-annotations` | `slideless pull-annotations [<presentationId>] [--at <N>] [--path <dir>]` | `GET /listAnnotationsForOwner` | `presentations:read` (owner-only) |
| `apply-annotations` | (no CLI — agent reads local `.slideless/annotations.json` and edits the deck) | (local only) | (none) |
| `unshare-presentation` | `slideless unshare <presentationId> [--token <tokenId>]` | `POST /unsharePresentation` | `presentations:write` |
| `delete-presentation` | `slideless delete <presentationId> --yes` | `POST /deletePresentation` | `presentations:write` |
| `invite-collaborator` | `slideless invite <presentationId> --email <addr>` | `POST /inviteCollaborator` | `presentations:write` |
| `uninvite-collaborator` | `slideless uninvite <presentationId> <collaboratorId>` | `POST /uninviteCollaborator` | `presentations:write` |
| `share-presentation-email` | `slideless share-email` | `POST /sharePresentationViaEmail` | `presentations:write` |
| `list-presentations` | `slideless list` | `GET /listMyPresentations` | `presentations:read` |
| `get-presentation` | `slideless get` | `GET /getSharedPresentationInfo/<presentationId>` | `presentations:read` |
| `browse-marketplace` | `slideless search` | `GET /listMarketplaceListings` | (none — public) |
| `publish-to-marketplace` | `slideless publish` | `POST /publishMarketplaceListing` | `marketplace:publish` |
| `remix-template` | `slideless remix` | `GET /getMarketplaceListing` + `GET /getMarketplaceListingFiles` + `GET /downloadMarketplaceAsset` | (none — public) |
| (viewer, public) | (no CLI — recipients open the share URL) | `GET /getSharedPresentation/<presentationId>/_t/<token>/<assetPath>` | unguessable token in URL |

The `push-presentation` skill accepts a `source_path` that can be either a folder (with `index.html` + sibling assets) or a single `.html` file. Static scan catches parent-directory escapes (`../outside/foo.jpg`) as hard errors. The CLI writes `slideless.json` at the deck root on the first push — the same skill handles subsequent updates because the CLI detects the file and sends `expectedBaseVersion`. Unchanged assets across versions are deduplicated by SHA-256 — only modified files re-upload.

A fresh push does not mint a viewer URL. The agent must call `share-presentation` afterwards if the user wants a public link.

**Annotation review loop.** `share-presentation --annotator --name "<reviewer>"` mints a link whose holder can leave notes in the shared viewer (the name becomes the note author). The review loop is:

```
share-presentation --annotator → [reviewers annotate in the browser] → pull-annotations → apply-annotations → push-presentation
```

`pull-annotations` is owner-only and merges hosted reviewer notes into the deck's local `.slideless/annotations.json` (schema v2; deduped by note id, additive, `source: "hosted"`). `apply-annotations` is a network-free **agent** skill (no CLI command): it reads that local file and best-effort edits the deck to address each `processed: false` note, anchoring via `anchor.selector` → `anchor.container` → `selectedText` + `context`. `slideless dev` captures the user's own notes into the same file (`source: "local"`); `apply-annotations` handles local and hosted notes identically.

Skills always pass `--json` so the response shape is stable: `{ success: true, data: ... }` or `{ success: false, status, error: { code, message } }`.

Auth is via the standard `Authorization: Bearer <key>` header. The CLI handles this — skills should not deal with headers directly.

Don't confuse `cko_…` slideless API keys with `CODIKA_ADMIN_API_KEY` (which targets a different backend).
