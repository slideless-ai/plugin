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
│   ├── share-presentation/
│   │   └── SKILL.md
│   ├── update-presentation/
│   │   └── SKILL.md
│   ├── list-presentations/
│   │   └── SKILL.md
│   ├── get-presentation/
│   │   └── SKILL.md
│   └── export-presentation-pdf/
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

All non-`generate-presentation` and non-`export-presentation-pdf` skills delegate to the **`slideless` CLI** (npm package), which wraps the slideless-ai backend's HTTP API. Skills never call curl or hand-roll fetch; the CLI centralises auth, base URL, error decoding, and JSON output shape.

| Skill | CLI command | Backing endpoint | Required scope |
|---|---|---|---|
| `setup-slideless` | `slideless auth signup-request/signup-complete/login-request/login-complete` (primary), `slideless login` (fallback), `slideless whoami` / `verify` | `POST /cliRequestSignupOtp`, `/cliCompleteSignup`, `/cliRequestLoginOtp`, `/cliCompleteLogin`, `/verifyApiKey` | (mints its own `cko_` key with `presentations:read` + `presentations:write`) |
| `share-presentation` | `slideless share` (or `slideless update` with `--update`) | `POST /uploadSharedPresentation` / `POST /updateSharedPresentation` | `presentations:write` |
| `share-presentation-email` | `slideless share-email` | `POST /sharePresentationViaEmail` | `presentations:write` |
| `update-presentation` | `slideless update` | `POST /updateSharedPresentation` | `presentations:write` |
| `list-presentations` | `slideless list` | `GET /listMyPresentations` | `presentations:read` |
| `get-presentation` | `slideless get` | `GET /getSharedPresentationInfo/<shareId>` | `presentations:read` |
| `revoke-presentation` | `slideless revoke` | `POST /revokeSharedPresentation` | `presentations:write` |
| `add-presentation-token` | `slideless token add` | `POST /addPresentationToken` | `presentations:write` |
| (viewer, public) | (no CLI) | `GET /getSharedPresentation/<shareId>?token=...` | unguessable token in URL |

Skills always pass `--json` so the response shape is stable: `{ success: true, data: ... }` or `{ success: false, status, error: { code, message } }`.

Auth is via the standard `Authorization: Bearer <key>` header. The CLI handles this — skills should not deal with headers directly.

Don't confuse `cko_…` slideless API keys with `CODIKA_ADMIN_API_KEY` (which targets a different backend).
