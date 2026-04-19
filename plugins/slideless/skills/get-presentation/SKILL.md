---
name: get-presentation
description: "Fetch full metadata for a single shared presentation: title, version, all share tokens with per-token view counts, archive status, expiration, total views. Use when the user asks 'how many views does my deck have', 'what URLs am I sharing for X', 'who has access to this presentation', or to confirm details before updating or revoking."
---

# Get Presentation

Wraps the slideless-ai `getSharedPresentationInfoPublic` Cloud Function. Returns full metadata + per-token info for a single shared presentation.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `share_id` | yes | The `shareId` from a previous `share-presentation` call, the user's dashboard URL, or `list-presentations` output. |

## Prerequisites

- `SLIDELESS_API_KEY` in `~/.codika/.env` (run `setup-slideless` if you don't have one)
- Scope `presentations:read` (or `presentations:write`)
- The user must own this presentation (ownership checked server-side)

## Steps

```bash
source ~/.codika/.env
curl -sS \
  -H "X-Process-Manager-Key: $SLIDELESS_API_KEY" \
  "https://europe-west1-slideless-ai.cloudfunctions.net/getSharedPresentationInfoPublic/$SHARE_ID"
```

## Expected response

```json
{
  "id": "01a3b…",
  "ownerId": "tnzblYpM…",
  "organizationId": "ORG…",
  "title": "Q4 board deck",
  "version": 3,
  "createdAt": "2026-04-18T12:34:56.000Z",
  "updatedAt": "2026-04-18T15:00:00.000Z",
  "archived": false,
  "archivedAt": null,
  "expiresAt": null,
  "totalViews": 12,
  "lastViewedAt": "2026-04-19T08:00:00.000Z",
  "primaryShareUrl": "https://…/getSharedPresentation/01a3b…?token=…",
  "tokens": [
    {
      "tokenId": "01a3c…",
      "name": "default",
      "createdAt": "2026-04-18T12:34:56.000Z",
      "revoked": false,
      "revokedAt": null,
      "lastAccessedAt": "2026-04-19T08:00:00.000Z",
      "accessCount": 7,
      "shareUrl": "https://…/getSharedPresentation/01a3b…?token=…"
    },
    {
      "tokenId": "01a3d…",
      "name": "Acme Corp",
      "createdAt": "2026-04-18T16:00:00.000Z",
      "revoked": false,
      "revokedAt": null,
      "lastAccessedAt": "2026-04-19T09:30:00.000Z",
      "accessCount": 5,
      "shareUrl": "https://…/getSharedPresentation/01a3b…?token=…"
    }
  ]
}
```

## Presenting results to the user

- Lead with title, version, and `totalViews`
- Then list each token: name, accessCount, lastAccessedAt, status (active/revoked)
- Surface the `primaryShareUrl` separately for easy copy-paste
- Don't repeat `shareUrl` for every token unless the user explicitly asks — the long URLs are noisy

## Pitfalls

- **Wrong shareId** → 404. Confirm with `list-presentations` first if unsure.
- **Not the owner** → 403 with `permission-denied`.
- **Per-token shareUrl includes the secret token** — surface them only when the user wants to share with a new recipient. Don't paste them in chat history that gets shared elsewhere.

## Output checklist

- [ ] API key resolved
- [ ] Get returned 200 with the requested shareId
- [ ] Token list rendered in a scannable format
- [ ] Total views and last-viewed-at surfaced clearly
- [ ] Sensitive `shareUrl` values only quoted when the user is about to share them
