---
name: list-presentations
description: "List every slideless presentation the user can access — both the ones they own and the ones shared with them as a dev collaborator. Each row has a `role` field (`owner` or `dev`). Use when the user asks 'what presentations do I have', 'show me my decks', 'do I have access to X', or before deciding between push (new) and push from an existing folder (update)."
---

# List Presentations

Wraps `slideless list`. Returns a merged list: decks owned by the caller plus decks shared with them as an active dev collaborator. Each item carries `role: 'owner' | 'dev'` so agents can decide what's safe to act on.

## Prerequisites

- `slideless` CLI installed and authenticated (run `setup-slideless` otherwise).
- Active profile has `presentations:read` (granted by `presentations:write` too).

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
        "id": "01HXYZ...",
        "title": "Q4 board deck",
        "currentVersion": 3,
        "createdAt": "2026-04-18T12:34:56.000Z",
        "updatedAt": "2026-04-24T15:00:00.000Z",
        "totalViews": 12,
        "lastViewedAt": "2026-04-19T08:00:00.000Z",
        "shareUrl": "https://…",
        "role": "owner",
        "hasActiveCollaborators": true,
        "ownerDisplayName": "Romain"
      },
      {
        "id": "01AB...",
        "title": "Partner pitch",
        "currentVersion": 2,
        "createdAt": "2026-04-15T00:00:00.000Z",
        "updatedAt": "2026-04-22T09:00:00.000Z",
        "totalViews": 0,
        "lastViewedAt": null,
        "shareUrl": null,
        "role": "dev",
        "hasActiveCollaborators": false,
        "ownerDisplayName": "Alice"
      }
    ]
  }
}
```

Sorted by `updatedAt` descending. `shareUrl` is `null` when the presentation has no active token (unshared).

## Presenting results

- Lead with `role`. If the deck is shared (`role: 'dev'`), make it clear the user can edit but not mint new viewer URLs.
- For `dev` rows, `ownerDisplayName` is useful: "Alice shared Partner pitch with you".
- If empty: tell the user no decks yet, suggest `push-presentation ./folder --title "…"`.

## Pitfalls

- **Empty despite uploads** — check the active profile via `slideless whoami`. Each user owns their own decks.
- **No `role: dev` rows despite an invite** — the invite might still be pending (invitee hasn't signed up yet).
- **Pagination** — capped at 100. No cursor yet.

## Output checklist

- [ ] Report both owned and shared-with-me decks.
- [ ] For each, surface `id`, `title`, `role`, `currentVersion`, and `shareUrl` (if present).
- [ ] If the user asked about a specific deck, surface the matching `id` so they can act on it (push / share / invite / delete).
