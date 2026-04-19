---
name: update-presentation
description: "Replace the HTML of an existing shared presentation in place. The shareId and share URL stay the same so existing recipients see the new content on their next page load. View counts and tokens are preserved. Use this when the user asks to update, refresh, or republish a presentation they've already shared, or when iterating on a deck after small edits."
---

# Update Presentation

Wraps the slideless-ai `updateSharedPresentation` Cloud Function. Same URL, new HTML, version bumps, view count preserved.

## Inputs

| Input | Required | Notes |
|---|---|---|
| `share_id` | yes | The `shareId` returned by a previous `share-presentation` call (the user has it in chat history or in their dashboard at `/organizations/<orgId>/presentations`). |
| `html_path` | yes | Absolute path to the local `.html` file with the updated content. |
| `title` | optional | New title. If omitted, keeps the existing title. |

## Prerequisites

- `SLIDELESS_API_KEY` in `~/.codika/.env` (run `setup-slideless` if you don't have one)
- The user must own the presentation being updated (ownership is checked server-side; updating someone else's presentation returns 403)

## Steps

1. **Validate inputs** — confirm the file at `html_path` exists, is non-empty, and is under 10 MB
2. **Read the HTML** from disk
3. **Resolve the API key** from `~/.codika/.env` (or env var)
4. **POST to the update endpoint**:

```bash
curl -sS -X POST \
  -H "X-Process-Manager-Key: $SLIDELESS_API_KEY" \
  -H "Content-Type: application/json" \
  --data-binary @<(jq -Rs --arg id "$SHARE_ID" --arg title "$TITLE" '{shareId: $id, html: ., title: $title}' < "$HTML_PATH") \
  "https://europe-west1-slideless-ai.cloudfunctions.net/updateSharedPresentation"
```

(If `title` is omitted, drop the `--arg title` and `title: $title` parts.)

## Expected response

```json
{
  "shareId": "01a3b…",
  "version": 2,
  "shareUrl": "https://europe-west1-slideless-ai.cloudfunctions.net/getSharedPresentation/01a3b…?token=…"
}
```

Tell the user: "Updated to version N. Same URL — recipients see the new content on next load."

## Pitfalls

- **Wrong shareId** → 404. The `shareId` is the UUIDv7 from the upload response (also visible in the dashboard URL `/presentations/<shareId>`).
- **Updating someone else's presentation** → 403 with `permission-denied`. Only the original owner can update.
- **Updating an archived presentation** → 410 with `archived`. Create a fresh one with `share-presentation` instead.
- **HTML > 10 MB** → 413 with `payload-too-large`. Slim the deck (compress images, inline fewer fonts).
- **No `presentations:write` scope on the key** → 403. Re-run `setup-slideless` and pick the right scope.

## Output checklist

- [ ] HTML file exists and is non-empty
- [ ] API key resolved
- [ ] Update returned 200 with version > previous version
- [ ] Surface the unchanged share URL to the user (same as before — no need to re-distribute)
