---
name: list-presentations
description: "List the user's shared presentations on slideless — id, title, version, view count, share URL. Use when the user asks 'what presentations have I shared', 'show me my decks', 'do I already have a share link for X', or before deciding whether to create a new share or update an existing one with update-presentation."
---

# List Presentations

Wraps `slideless list`. Returns up to 100 of the user's most recently created shared presentations.

## Prerequisites

- `slideless` CLI installed and authenticated — if `slideless --version` fails with `command not found`, invoke the `setup-slideless` skill first, then retry.
- Active profile must have `presentations:read` (granted by `presentations:write` too)

## Steps

```bash
slideless list --json
```

## Expected response

```json
{
  "success": true,
  "data": {
    "presentations": [
      {
        "id": "01a3b…",
        "title": "Q4 board deck",
        "version": 3,
        "createdAt": "2026-04-18T12:34:56.000Z",
        "updatedAt": "2026-04-18T15:00:00.000Z",
        "archived": false,
        "totalViews": 12,
        "lastViewedAt": "2026-04-19T08:00:00.000Z",
        "shareUrl": "https://…"
      }
    ]
  }
}
```

Sorted by `createdAt` descending. `shareUrl` is `null` for archived presentations or those with no active token.

## Presenting results to the user

- If empty: "You haven't shared any presentations yet. Generate one with `generate-presentation` and share it with `share-presentation`."
- If non-empty: render a compact list with title, version (`v3`), totalViews (`12 views`), and the share URL. A markdown table works well.
- If the user asked for a specific presentation by name, filter results client-side and surface the matching `id` so they can pass it to `update-presentation` or `get-presentation`.

## Pitfalls

- **No results despite having uploaded** → check that the active profile belongs to the same user/org as the upload (each user owns their own presentations; cross-user listing isn't supported). `slideless whoami` confirms identity.
- **Pagination** → capped at 100. v1 has no `cursor` parameter. If a power user has more, they'll only see the latest 100.
- **Wrong scope** → `permission-denied`. Re-run `setup-slideless` and grant `presentations:read`.

## Output checklist

- [ ] CLI returned `success: true`
- [ ] Results presented in a scannable format
- [ ] If the user asked for a specific deck, the matching `id` is highlighted so they can act on it
