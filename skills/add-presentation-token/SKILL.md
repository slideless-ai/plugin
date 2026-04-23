---
name: add-presentation-token
description: "Mint a new named share token on an existing presentation so the user can send a fresh link to a specific recipient — with independent view tracking and the ability to revoke just that recipient later. Use when the user says 'give me a new link for Acme', 'I need a separate URL for the board', or 'make another share link for John' on a deck that already exists."
---

# Add Presentation Token

Wraps `slideless token add`. Creates a new named token on an existing presentation so the user can issue per-recipient links with separate view counts and independent revocation.

## When to use vs alternatives

- Use **this skill** when the presentation already exists and the user wants a *new*, *separately trackable* link for a specific recipient.
- Use `share-presentation` instead if the presentation doesn't exist yet.
- Use `share-presentation-email` instead if the goal is to email the link directly — that skill already mints per-recipient tokens automatically.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `share_id` | yes | The `shareId` from a previous `share-presentation` call, the dashboard URL, or `slideless list`. |
| `token_name` | yes | Human-readable label (e.g. "Acme Corp", "Board — John"). Shows up in `get-presentation` and the dashboard. |

## Prerequisites

- `slideless` CLI installed and authenticated — if `slideless --version` fails with `command not found`, invoke the `setup-slideless` skill first, then retry.
- Active profile must have `presentations:write`.
- The user must own this presentation (ownership checked server-side).
- The presentation must not be archived — archived decks can't accept new tokens.

## Steps

```bash
slideless token add "$SHARE_ID" --name "$TOKEN_NAME" --json
```

## Expected response

```json
{
  "success": true,
  "data": {
    "tokenId": "01a3c…",
    "token": "r2h_cS3eqVg4…",
    "shareUrl": "https://app.slideless.ai/share/01a3b…?token=r2h_cS3eqVg4…"
  }
}
```

The `shareUrl` is the link to hand to the recipient — it already has the token embedded. `tokenId` is what you'll use later if the user wants to revoke just this recipient.

## Presenting results to the user

- Lead with the `shareUrl` — that's the thing they want.
- Mention the token name you used so they know which recipient is tracked.
- Note that they can revoke this specific recipient later via `revoke-presentation` with `token_id`.

## Pitfalls

- **Archived presentation** → HTTP 410 `archived`. Can't add tokens to a dead deck. Offer to `share-presentation` again (new URL).
- **Wrong `share_id`** → HTTP 404 `not-found`. Run `list-presentations` to find the right one.
- **Not the owner** → HTTP 403 `permission-denied`.
- **Don't paste `shareUrl` into logs or chat history that may be shared** — it grants access until revoked.

## Output checklist

- [ ] CLI returned `success: true` with a `tokenId`, `token`, and `shareUrl`
- [ ] `shareUrl` surfaced cleanly for copy-paste
- [ ] User told the token name that was registered
- [ ] User told how to revoke just this recipient later (`revoke-presentation` + `token_id`)
