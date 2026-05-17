---
name: publish-to-marketplace
description: Publish a pushed slideless deck to the public Slideless marketplace as a remixable presentation, app, or plan. Wraps `slideless publish`. Use when the user asks to "publish to the marketplace", "list my deck publicly", "make this a template", or "share this as a remixable tool". Requires an API key with the `marketplace:publish` scope; the deck must already be pushed (have a `slideless.json`).
---

# Publish to Marketplace

Wraps `slideless publish`. Takes a deck that is already linked + pushed (it has a `slideless.json` at its root) and publishes it as a public marketplace listing other users can browse, star, and remix.

Run this **inside the linked deck folder**. The CLI reads `slideless.json` to know which presentation to publish — there is no `presentationId` argument.

A listing has a `kind`: `presentation` (a deck you view), `app` (a self-contained interactive HTML app), or `plan` (an agent-executable build plan). The `kind` is fixed at publish time and cannot be changed afterward, so choose deliberately.

If the deck was created with `remix-template`, publishing **automatically records its remix lineage** — the new listing exposes `remixedFromSlug` and its marketplace page shows "Remixed from &lt;original&gt;". This rides along from the `.slideless-remix.json` marker through the deck's first push; there is no flag and nothing to set.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `kind` | yes | `presentation`, `app`, or `plan`. Fixed at publish; cannot change later. |
| `description` | yes | Short marketplace blurb. What the listing is and who it's for. |
| `slug` | optional | URL slug under `slideless.ai/marketplace/`. Auto-derived from the title if omitted. Must be unique. |
| `title` | optional | Display title for the listing. Defaults to the deck's title. |
| `tags` | optional | Comma-separated tags for search/filtering (e.g. `pitch,saas,dark`). |
| `stack` | optional | Tech stack: lowercase technology slugs, comma-separated (e.g. `nextjs,firebase,n8n`). One slug per technology — no display names, no version numbers. Free-form (any slug is accepted); maps to the listing's `techStack`. |
| `category` | optional | Single category bucket (e.g. `pitch-decks`, `utilities`). |
| `version` | optional | Which pushed version to publish. Defaults to the deck's latest version. |

## Prerequisites

- `slideless` CLI installed + authenticated (run `setup-slideless` otherwise).
- CLI version ≥ 0.5.0.
- The current directory is a linked deck folder — it has a `slideless.json`. If not, run `push-presentation` first.
- The active key has the `marketplace:publish` scope. Check with `slideless whoami`; a key minted only with `presentations:read`/`presentations:write` will fail with `permission-denied`.

## Steps

1. Verify the CLI + auth (`slideless --version`, `slideless whoami`). Confirm `marketplace:publish` is in scopes.
2. Confirm `slideless.json` exists in the current directory. If it doesn't, the deck isn't pushed — stop and run `push-presentation`.
3. Decide `kind` with the user if unclear: a deck to view → `presentation`; a self-contained interactive HTML app → `app`; an agent-executable build plan → `plan`. Remind them it's permanent.
4. Run `slideless publish --kind <presentation|app|plan> --description "…" [--slug …] [--title "…"] [--tags a,b,c] [--stack a,b,c] [--category …] [--version N] --json`.
5. Parse JSON. Report the `slug`, the public `marketplace/<slug>` URL, and the published `version`.

## Expected response

```json
{
  "success": true,
  "data": {
    "slug": "minimal-saas-pitch",
    "kind": "presentation",
    "status": "public",
    "title": "Minimal SaaS Pitch",
    "publishedVersion": 3,
    "remixedFromSlug": null,
    "marketplaceUrl": "https://slideless.ai/marketplace/minimal-saas-pitch"
  }
}
```

`remixedFromSlug` is the source listing slug when the deck was remixed, or `null` otherwise.

## Presenting results

- Give the user the `marketplaceUrl` (`slideless.ai/marketplace/<slug>`) — that's the shareable public page.
- State the `kind` and `publishedVersion`, and remind them `kind` is now fixed.
- If `remixedFromSlug` is set, tell the user the listing credits the original ("Remixed from …") — this was carried from the remix marker automatically.
- Mention that future `slideless push` calls update the deck but do not auto-republish; re-run `publish-to-marketplace` to publish a newer version.

## Pitfalls

- **`kind` is permanent.** It cannot be changed after publishing. If the user picked wrong, they must unpublish and create a new listing.
- **Deck must already be pushed.** `publish` does not upload content — it publishes an existing pushed version. Run `push-presentation` first if there's no `slideless.json`.
- **Scope error** — `permission-denied` means the active key lacks `marketplace:publish`. The user mints a marketplace-scoped key from the dashboard.
- **Slug collision** — if the slug is taken, the CLI fails; pass a different `--slug`.

## Output checklist

- [ ] Report the `slug` and the `marketplace/<slug>` URL.
- [ ] State the `kind` (and that it's now fixed) and the `publishedVersion`.
- [ ] If the deck wasn't pushed, route the user to `push-presentation` first.

## Next step

The listing is live. Others can find it via `browse-marketplace` and copy it with `remix-template`. To publish a newer version later, push the deck again then re-run `publish-to-marketplace`.
