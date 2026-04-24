---
name: unshare-presentation
description: Revoke viewer tokens on a slideless presentation. Without a token ID, revokes every active token on the deck (all public URLs stop working). With `--token`, revokes just that one token. The deck itself stays — you can mint new URLs later via `share-presentation`.
---

# Unshare Presentation

Wraps `slideless unshare`. Revokes share tokens without affecting the deck or its collaborators.

This is the inverse of `share-presentation`. To permanently remove the deck, use `delete-presentation`.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | yes | The presentation to unshare. |
| `token_id` | optional | When present, revoke just that token. When omitted, revoke every active token on the deck. |

## Prerequisites

- Owner-only.

## Steps

1. Run `slideless unshare <presentation_id> [--token <tokenId>] --json`.
2. Parse JSON. Report `tokensRevoked`.

## Example JSON

```json
{
  "success": true,
  "data": {
    "success": true,
    "tokensRevoked": 4
  }
}
```

## Pitfalls

- Unshare does NOT delete the deck. To remove it entirely, use `delete-presentation`.
- Collaborators still have dev access after unshare — they can still push and pull. Use `uninvite-collaborator` to remove them.

## Output checklist

- [ ] Report the number of tokens revoked.
- [ ] Remind the user they can still mint new URLs with `share-presentation`.
