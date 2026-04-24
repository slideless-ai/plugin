---
name: uninvite-collaborator
description: Revoke a dev collaborator from a slideless presentation. They immediately lose edit access (next push returns 403) and the deck disappears from their `list`. Symmetric with `invite-collaborator`.
---

# Uninvite Collaborator

Wraps `slideless uninvite`. Flips the collaborator row to `status='revoked'`.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | yes | The presentation. |
| `collaborator_id` | yes | The collaborator row ID to revoke. Obtain from `get-presentation` or from a previous `invite-collaborator` response. |

## Prerequisites

- Owner-only.

## Steps

1. If you don't already have the `collaborator_id`, fetch it via `get-presentation <presentation_id>` (owner sees the collaborators list).
2. Run `slideless uninvite <presentation_id> <collaborator_id> --json`.
3. Parse JSON and report success.

## Example JSON

```json
{
  "success": true,
  "data": { "success": true, "collaboratorId": "01H..." }
}
```

## Pitfalls

- Revocation is immediate — no grace period.
- Previously pushed versions stay in the history. Their manifest records the dev's userId + `createdByRole: 'dev'`.

## Output checklist

- [ ] Confirm who was revoked (email is useful for the user).
- [ ] Mention that their next `push`/`pull` will fail with 403.
