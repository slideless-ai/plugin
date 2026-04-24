---
name: invite-collaborator
description: Invite a dev collaborator to a slideless presentation by email. If the invitee already has a Slideless account, access is granted immediately. Otherwise a pending invite is created and auto-claimed on signup. Collaborators can push new versions but cannot mint viewer URLs or invite others.
---

# Invite Collaborator

Wraps `slideless invite`. Grants **dev** (edit) access to one user on a single presentation.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | yes | The presentation to invite into. |
| `email` | yes | Invitee's email address. Normalised to lowercase. |
| `message` | optional | Short personal message for the invite email. |

## Prerequisites

- Owner-only.
- Max 10 concurrent active + pending collaborators per presentation.

## Steps

1. Run `slideless invite <presentation_id> --email <addr> [--message "…"] --json`.
2. Parse JSON. The `status` field tells you whether the user was already registered:
   - `active` → the collaborator got access immediately (they'll see the deck next time they `slideless list`).
   - `pending` → the invite email was sent. It auto-claims when they sign up.

## Example JSON

```json
{
  "success": true,
  "data": {
    "collaboratorId": "01H...",
    "email": "alice@example.com",
    "status": "pending",
    "userId": null,
    "inviteAlreadyExisted": false
  }
}
```

## Pitfalls

- Collaborators push using their own API key + organization, so they spend **their own** storage quota — not the owner's.
- A collaborator can push, but cannot mint viewer tokens, invite others, or delete the deck.
- If the invite already exists, the call returns the existing row with `inviteAlreadyExisted: true` — idempotent.

## Output checklist

- [ ] Report the `collaboratorId` (the owner will need it for `uninvite-collaborator`).
- [ ] Report the `status` (active vs pending) so the user knows what happens next.
- [ ] For pending invites, mention the email that was sent.
