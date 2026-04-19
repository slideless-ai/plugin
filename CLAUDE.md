# Slideless Marketplace

Public Claude Code plugin marketplace. Distributes the `slideless` plugin: skills for generating, sharing, and managing HTML presentations.

## Repository Structure

```
.
├── .claude-plugin/
│   └── marketplace.json              # Marketplace catalog
├── plugins/
│   └── slideless/
│       ├── .claude-plugin/
│       │   └── plugin.json
│       └── skills/
│           ├── setup-slideless/
│           │   └── SKILL.md
│           ├── generate-presentation/
│           │   ├── SKILL.md
│           │   └── styles/
│           │       ├── README.md
│           │       ├── slim-tabbed/
│           │       │   ├── README.md
│           │       │   ├── how-to-build.md
│           │       │   └── example.html
│           │       └── full-deck/
│           │           ├── README.md
│           │           ├── how-to-build.md
│           │           └── example.html
│           ├── share-presentation/
│           │   └── SKILL.md
│           ├── update-presentation/
│           │   └── SKILL.md
│           ├── list-presentations/
│           │   └── SKILL.md
│           └── get-presentation/
│               └── SKILL.md
├── README.md
├── CLAUDE.md
└── LICENSE
```

## Conventions

- Skills must not contain secrets, API keys, or internal URLs (the public Cloud Function URLs are fine — they're auth-gated)
- Every style is a self-contained folder: `README.md` (when to pick it), `how-to-build.md` (how to generate it), `example.html` (production reference)
- The `example.html` for each style is the **source of truth** — when in doubt about a CSS/JS pattern, the build guide must match what's in `example.html`
- Each example must be a single self-contained HTML file with no external dependencies beyond the Google Fonts CDN
- Keep `SKILL.md` files self-contained: each works standalone

## Adding a New Style

1. Create `plugins/slideless/skills/generate-presentation/styles/<style-name>/`
2. Add `README.md`, `how-to-build.md`, and `example.html`
3. Register the style in `plugins/slideless/skills/generate-presentation/styles/README.md` (the picker table) and in the SKILL.md style index
4. Update the README.md style table

## Adding a New Skill

1. Create `plugins/slideless/skills/<skill-name>/SKILL.md` with YAML frontmatter (`name`, `description`)
2. The plugin loader will pick it up automatically; no plugin.json edits needed
3. Document it in `README.md`

## Backend Dependency

All non-`generate-presentation` and non-`export-presentation-pdf` skills delegate to the **`slideless` CLI** (npm package), which wraps the slideless-ai backend's HTTP API. Skills never call curl or hand-roll fetch; the CLI centralises auth, base URL, error decoding, and JSON output shape.

| Skill | CLI command | Backing endpoint | Required scope |
|---|---|---|---|
| `setup-slideless` | `slideless auth signup-request/signup-complete/login-request/login-complete` (primary), `slideless login` (fallback), `slideless whoami` / `verify` | `POST /cliRequestSignupOtp`, `/cliCompleteSignup`, `/cliRequestLoginOtp`, `/cliCompleteLogin`, `/verifyApiKey` | (mints its own `cko_` key with `presentations:read` + `presentations:write`) |
| `share-presentation` | `slideless share` (or `slideless update` with `--update`) | `POST /uploadSharedPresentation` / `POST /updateSharedPresentation` | `presentations:write` |
| `update-presentation` | `slideless update` | `POST /updateSharedPresentation` | `presentations:write` |
| `list-presentations` | `slideless list` | `GET /listMyPresentations` | `presentations:read` |
| `get-presentation` | `slideless get` | `GET /getSharedPresentationInfo/<shareId>` | `presentations:read` |
| (viewer, public) | (no CLI) | `GET /getSharedPresentation/<shareId>?token=...` | unguessable token in URL |

Skills always pass `--json` so the response shape is stable: `{ success: true, data: ... }` or `{ success: false, status, error: { code, message } }`.

Auth is via the standard `Authorization: Bearer <key>` header. The CLI handles this — skills should not deal with headers directly.

Don't confuse `cko_…` slideless API keys with `CODIKA_ADMIN_API_KEY` (which targets a different backend).
