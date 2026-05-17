---
name: remix-template
description: Download a Slideless marketplace listing's files into a fresh local folder so the user can customize it as their own deck. Wraps `slideless remix`. No API key required. Use when the user asks to "remix this template", "use that marketplace deck as a starting point", "copy a listing", or "start from <slug>". The result is an unlinked folder — follow up with `push-presentation` to create the user's own deck.
---

# Remix Template

Wraps `slideless remix <slug>`. Downloads the files of a public marketplace listing into a **fresh local folder** so the user can edit it and make it their own.

No API key is required — the marketplace is public. This is a read-only copy operation; it does not touch the original listing's owner.

**The downloaded folder is NOT linked.** It deliberately contains **no `slideless.json`**. It is not yet a Slideless deck — it is just files on disk. The user owns nothing on the server until they push it. The natural next step is the `push-presentation` skill, which creates a brand-new deck owned by the user and writes the `slideless.json`.

## Remix lineage (`.slideless-remix.json`)

`slideless remix` writes one extra file into the folder: **`.slideless-remix.json`** — a small marker recording `remixedFromSlug`, `remixedFromVersion`, `remixedFromTitle`, and `remixedAt`. It is **not** a `slideless.json`; the folder stays unlinked.

This marker is how attribution flows forward:

- The **first `slideless push`** from the folder reads the marker and stores the lineage on the new presentation **once, at creation, immutably**.
- When the user later **publishes** that deck, the lineage is copied onto the listing automatically — its marketplace page shows **"Remixed from &lt;original&gt;"**. No flag, nothing to configure.
- The marker is **excluded from the uploaded deck** (like `slideless.json`).

Leave `.slideless-remix.json` in place by default. Deleting it **before the first push** loses the lineage permanently; deleting it **after the first push** is harmless (the server already has it). Only delete it before pushing if the user explicitly wants an uncredited copy.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `slug` | yes | The marketplace listing slug (from `browse-marketplace` or a `slideless.ai/marketplace/<slug>` URL). |
| `path` | optional | Target folder for the download. Defaults to a new folder named after the slug. Must be empty or not exist. |

## Prerequisites

- `slideless` CLI installed, version ≥ 0.5.0. No authentication needed — `remix` works without a profile.
- The target `path` is empty or does not exist (the CLI won't overwrite an existing deck).

## Steps

1. Verify the CLI is installed (`slideless --version`). Auth is not required.
2. If the user gave a marketplace URL, extract the `<slug>` from `slideless.ai/marketplace/<slug>`.
3. Run `slideless remix <slug> [path] --json`.
4. Parse JSON. Report where the files landed and how many were downloaded.
5. Make it explicit: the folder has **no `slideless.json`** — it is an unlinked copy. To turn it into the user's own deck, run `push-presentation` on that folder.
6. Mention that a `.slideless-remix.json` lineage marker was written. Tell the user to keep it so a future `publish` credits the original — and not to delete it before the first push.

## Expected response

```json
{
  "success": true,
  "data": {
    "slug": "minimal-saas-pitch",
    "title": "Minimal SaaS Pitch",
    "path": "minimal-saas-pitch",
    "entryPath": "index.html",
    "fileCount": 7,
    "totalBytes": 482133,
    "linked": false,
    "remixMarker": ".slideless-remix.json",
    "remixedFromSlug": "minimal-saas-pitch",
    "remixedFromVersion": 3
  }
}
```

`linked: false` confirms there is no `slideless.json` — the copy is unlinked by design. `remixMarker` is the lineage file written into the folder; `remixedFromSlug` / `remixedFromVersion` echo what it records.

## Presenting results

- Tell the user where the files are (`path`) and the entry file (`entryPath`).
- Stress that this is an **unlinked copy** — they own nothing on the server yet.
- Route them to `push-presentation` on the new folder as the next step; that creates their own deck and links it.
- Offer to open/edit the entry HTML if they want to customize before pushing.

## Pitfalls

- **It's not a deck yet.** No `slideless.json` means `slideless push` from this folder creates a NEW presentation owned by the user — it does not update the original listing. That's the intended behavior.
- **Target folder must be free.** If `path` already contains a deck, the CLI refuses; pick an empty folder.
- **Don't confuse remix with pull.** `pull` syncs a deck you already own/collaborate on (needs `slideless.json` + auth). `remix` copies someone else's public listing into a fresh, unlinked folder.
- **Don't delete `.slideless-remix.json` before pushing.** That marker carries the "remixed from" credit. Deleting it before the first push loses the lineage for good; after the first push it's safe to remove.

## Output checklist

- [ ] Report the download `path` and `fileCount`.
- [ ] State clearly that the folder is unlinked (no `slideless.json`).
- [ ] Note the `.slideless-remix.json` lineage marker and that it should be kept.
- [ ] Route the user to `push-presentation` to create their own deck.

## Next step

Run `push-presentation` on the downloaded folder to create the user's own deck (this writes `slideless.json`). Then `share-presentation` to mint a viewer URL.
