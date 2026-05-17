---
name: browse-marketplace
description: Search and browse the public Slideless marketplace for remixable presentations, apps, and plans. Wraps `slideless search`. No API key required. Use when the user asks to "find a template", "browse the marketplace", "show me pitch deck templates", "what marketplace tools are there", or wants a starting point before generating a deck.
---

# Browse Marketplace

Wraps `slideless search`. Lists and filters public marketplace listings — `presentation` decks, interactive `app` listings, and agent-executable `plan` listings. No authentication required; the marketplace is public.

Lead every result with its **`slug`** — that is the identifier the user (or you) feeds into `remix-template` to copy a listing locally.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `query` | optional | Free-text search term. Omit to list everything (subject to filters/sort). |
| `kind` | optional | Filter by `presentation`, `app`, or `plan`. |
| `tag` | optional | Filter to listings carrying a given tag. |
| `category` | optional | Filter to a single category bucket. |
| `sort` | optional | `recent` (newest first), `popular` (most remixed/viewed), or `stars` (most starred). |

## Prerequisites

- `slideless` CLI installed, version ≥ 0.5.0. No authentication needed — `search` works without a profile.

## Steps

1. Verify the CLI is installed (`slideless --version`). Auth is not required.
2. Translate the user's intent into filters: a deck to view → `--kind presentation`; a self-contained HTML app → `--kind app`; an agent-executable build plan → `--kind plan`. Map "best"/"most popular" → `--sort popular`, "newest" → `--sort recent`.
3. Run `slideless search [query] [--kind …] [--tag …] [--category …] [--sort recent|popular|stars] --json`.
4. Parse JSON. Present each listing leading with its `slug`.

## Expected response

```json
{
  "success": true,
  "data": {
    "listings": [
      {
        "slug": "minimal-saas-pitch",
        "kind": "presentation",
        "interactive": false,
        "title": "Minimal SaaS Pitch",
        "description": "Clean dark-mode pitch deck for early-stage SaaS.",
        "tags": ["pitch", "saas", "dark"],
        "techStack": [],
        "category": "pitch-decks",
        "authorDisplayName": "Romain",
        "authorHandle": "romain",
        "previewUrl": "https://app.slideless.ai/share/…",
        "remixCount": 42,
        "starCount": 17,
        "viewCount": 530,
        "publishedVersion": 3,
        "updatedAt": "2026-05-10T09:00:00.000Z"
      }
    ],
    "nextCursor": null
  }
}
```

## Presenting results

- Lead each row with the **`slug`** — it's what `remix-template` consumes. Then `title`, `kind`, and a one-line `description`.
- Surface `remixCount` / `starCount` so the user can gauge popularity.
- If the user picks one, hand the `slug` straight to `remix-template`.
- If empty: suggest loosening filters, or `generate-presentation` to build from scratch.

## Pitfalls

- **No results** — filters may be too narrow. Drop `--tag`/`--category` and retry with just `query`.
- **Slug vs title** — `remix-template` needs the `slug`, not the display title. Always carry the slug forward.
- **Public listings only** — `search` never returns unlisted or private decks.

## Output checklist

- [ ] List each match leading with its `slug`.
- [ ] Include `kind`, `title`, and a short `description` per row.
- [ ] If the user wants one, route the `slug` into `remix-template`.

## Next step

Pick a listing and run `remix-template <slug>` to download it into a fresh folder, then `push-presentation` to make it the user's own deck.
