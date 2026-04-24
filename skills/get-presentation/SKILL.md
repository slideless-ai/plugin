---
name: get-presentation
description: "Fetch full metadata for a single shared presentation: title, currentVersion, all share tokens with per-token view counts and versionMode, archive status, expiration, total views. Use when the user asks 'how many views does my deck have', 'what URLs am I sharing for X', 'who has access to this presentation', or to confirm details before updating or revoking."
---

# Get Presentation

Wraps `slideless get`. Returns full metadata + per-token info for a single shared presentation.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `share_id` | yes | The `shareId` from a previous `share-presentation` call, the dashboard URL, or `slideless list` output. |

## Prerequisites

- `slideless` CLI installed and authenticated — if `slideless --version` fails with `command not found`, invoke the `setup-slideless` skill first, then retry.
- Active profile must have `presentations:read`
- The user must own this presentation (ownership checked server-side)

## Steps

```bash
slideless get "$SHARE_ID" --json
```

## Expected response

```json
{
  "success": true,
  "data": {
    "id": "01a3b…",
    "ownerId": "tnzblYpM…",
    "organizationId": "ORG…",
    "title": "Q4 board deck",
    "currentVersion": 3,
    "createdAt": "2026-04-18T12:34:56.000Z",
    "updatedAt": "2026-04-18T15:00:00.000Z",
    "archived": false,
    "archivedAt": null,
    "expiresAt": null,
    "totalViews": 12,
    "lastViewedAt": "2026-04-19T08:00:00.000Z",
    "primaryShareUrl": "https://…",
    "tokens": [
      {
        "tokenId": "01a3c…",
        "name": "default",
        "createdAt": "2026-04-18T12:34:56.000Z",
        "revoked": false,
        "revokedAt": null,
        "lastAccessedAt": "2026-04-19T08:00:00.000Z",
        "accessCount": 7,
        "shareUrl": "https://…",
        "versionMode": { "type": "latest" }
      },
      {
        "tokenId": "01a3d…",
        "name": "Acme Corp",
        "createdAt": "2026-04-18T16:00:00.000Z",
        "revoked": false,
        "revokedAt": null,
        "lastAccessedAt": "2026-04-19T09:30:00.000Z",
        "accessCount": 5,
        "shareUrl": "https://…",
        "versionMode": { "type": "pinned", "version": 2 }
      }
    ]
  }
}
```

## Presenting results to the user

- Lead with title, `currentVersion`, and `totalViews`
- List each token: `name`, `accessCount`, `lastAccessedAt`, status (active/revoked), `versionMode` (either "follows latest" or "pinned to vN")
- Surface `primaryShareUrl` separately for easy copy-paste
- Don't repeat per-token `shareUrl` unless the user explicitly asks — long URLs are noisy

## Pitfalls

- **Wrong shareId** → `not-found`. Confirm with `slideless list` first if unsure.
- **Not the owner** → `permission-denied`.
- **Per-token shareUrl includes the secret token** — surface them only when the user wants to share with a new recipient. Don't paste them in chat history that gets shared elsewhere.

## Output checklist

- [ ] CLI returned `success: true` with the requested shareId
- [ ] Token list rendered in a scannable format
- [ ] Total views and last-viewed-at surfaced clearly
- [ ] Sensitive `shareUrl` values only quoted when the user is about to share them

## Next steps

- To **mint a new token** for an additional recipient → `add-presentation-token`
- To **revoke a specific recipient's token** or archive the whole presentation → `revoke-presentation`
