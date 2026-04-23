---
name: revoke-presentation
description: "Revoke a shared presentation entirely (archive so all recipient links stop working) or revoke a single recipient token (invalidate one link while the others keep working). Use when the user says 'stop sharing X', 'cut off access for Acme', 'revoke the link I sent to John', or 'archive the Q3 deck'."
---

# Revoke Presentation

Wraps `slideless revoke`. Two modes:

- **Archive** — revoke every token on a presentation (all recipient links stop working). Irreversible.
- **Single token** — revoke one recipient's link while leaving other links active.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `share_id` | yes | The `shareId` from `share-presentation`, the dashboard URL, or `slideless list`. |
| `token_id` | no | If provided, revoke only this token. If omitted, archive the whole presentation. |

## Prerequisites

- `slideless` CLI installed and authenticated — if `slideless --version` fails with `command not found`, invoke the `setup-slideless` skill first, then retry.
- Active profile must have `presentations:write`.
- The user must own this presentation (ownership checked server-side).

## Steps

**Single token (most common for "cut off Acme"):**

```bash
slideless revoke "$SHARE_ID" --token "$TOKEN_ID" --json
```

**Archive entire presentation:**

```bash
slideless revoke "$SHARE_ID" --json
```

If you need the `tokenId` for a recipient you know by name, run `get-presentation` first to look it up in the `tokens[].tokenId` list.

## Expected response (both modes)

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

## Presenting results to the user

- **Single-token mode:** confirm the token name and say the link is now invalid. If you know other tokens exist, note they still work.
- **Archive mode:** confirm the presentation is archived, warn that all links stop working, and mention the action is irreversible — they'd need to `share-presentation` again (new URL) to re-share.

## Pitfalls

- **Already archived** → HTTP 410 `already-archived`. The presentation is already dead; no action needed.
- **Token already revoked** → HTTP 410 `token-already-revoked`.
- **Wrong `token_id`** → HTTP 404 `token-not-found`. Re-run `get-presentation` to pull the current token list.
- **Not the owner** → HTTP 403 `permission-denied`.
- **Confusion with dashboard** — revokes/archives done here are immediately visible in the web dashboard and vice-versa. They operate on the same store.

## Output checklist

- [ ] CLI returned `success: true`
- [ ] User is told clearly which mode ran (single token vs archive)
- [ ] For archive: user is warned the action is irreversible
- [ ] If relevant, user is told other tokens on the presentation still work (single-token mode)
