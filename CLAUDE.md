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

All non-`generate-presentation` skills call the **slideless-ai** backend (a standalone Firebase project). Endpoints:

| Skill | Endpoint | Auth |
|---|---|---|
| `setup-slideless` | `POST /verifyApiKey` | API key |
| `share-presentation` | `POST /uploadSharedPresentation` | API key (`presentations:write`) |
| `update-presentation` | `POST /updateSharedPresentation` | API key (`presentations:write`) |
| `list-presentations` | `GET /listMyPresentationsPublic` | API key (`presentations:read`) |
| `get-presentation` | `GET /getSharedPresentationInfoPublic/<shareId>` | API key (`presentations:read`) |
| (viewer, public) | `GET /getSharedPresentation/<shareId>?token=...` | unguessable token in URL |

Default base URL: `https://europe-west1-slideless-ai.cloudfunctions.net`

To use a custom domain or staging environment later, set `SLIDELESS_API_BASE_URL` in `~/.codika/.env` and update each SKILL.md to read from that env var. Skill source code lives in this repo — when the backend changes URL shape, version bump + edit the skills.

The auth header is `X-Process-Manager-Key` (NOT `Authorization: Bearer`) — inherited from codika-app-platform's API key middleware. Don't confuse with `CODIKA_ADMIN_API_KEY` which is a different key for a different backend.
