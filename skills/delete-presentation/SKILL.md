---
name: delete-presentation
description: HARD DELETE a slideless presentation. Removes the Firestore doc, every version, every asset in GCS, and every collaborator row. Irreversible — there is no undo. Confirm twice with the user before running this.
---

# Delete Presentation

Wraps `slideless delete`. This is a **destructive, irreversible** operation. Confirm with the user before running.

For non-destructive alternatives, reach for:
- `unshare-presentation` — stops public URLs from working, keeps the deck.
- `uninvite-collaborator` — removes a specific collaborator.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `presentation_id` | yes | The presentation to delete. |

## Prerequisites

- Owner-only.
- You have explicit user confirmation that delete is what they want.

## Steps

1. Confirm with the user once more (even if they already asked). Surface the title.
2. Run `slideless delete <presentation_id> --yes --json`. The `--yes` flag is required in agent contexts since the CLI otherwise prompts for a literal "delete" to be typed.
3. Parse JSON. Report `blobsDeleted` so the user sees the scope of cleanup.

## Example JSON

```json
{
  "success": true,
  "data": {
    "success": true,
    "blobsDeleted": 47
  }
}
```

## Pitfalls

- This is irreversible. Double-check the `presentation_id` before running.
- All collaborators will see the deck vanish from their `list` results.

## Output checklist

- [ ] Confirm the user wanted delete, not unshare.
- [ ] Report how many objects were removed.
